import { themeService } from "../../services";
import { errorHandlerWrapper, Logger } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Helper function to download image from URL and upload to S3
async function downloadAndUploadToS3(imageUrl: string, path: string, tileValue: number): Promise<string> {
  try {
    // Download the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });

    // Determine content type from response headers or URL
    const contentType = response.headers['content-type'] || 'image/png';
    const fileExtension = contentType.split('/')[1] || 'png';
    const fileName = `${path}/tile_${tileValue}_${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'evofuse2048',
      Key: fileName,
      Body: Buffer.from(response.data),
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return the URL to the uploaded file
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    Logger.error(`Failed to download and upload image for tile ${tileValue}:`, error);
    throw new Error(`Failed to process image for tile ${tileValue}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const createAIThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uuid } = req.user;
    const {
      title,
      description,
      visibility,
      price,
      numberDisplay,
      tilePrompts,
      generatedImages,
    } = req.body;

    // Validate required fields
    if (!title || !tilePrompts || !generatedImages) {
      res.status(httpStatus.BAD_REQUEST).json({
        error: true,
        message: 'Missing required fields: title, tilePrompts, or generatedImages'
      });
      return;
    }

    // Set up SSE headers for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial progress
    res.write(`data: ${JSON.stringify({
      status: 'downloading',
      progress: 0,
      message: 'Starting image upload...'
    })}\n\n`);

    // Download and upload all images to S3
    const tileData: Record<string, any> = {};
    const tileValues = Object.keys(generatedImages).map(Number);
    const totalImages = tileValues.length;
    let uploadedImages = 0;

    for (const tileValue of tileValues) {
      const imageUrl = generatedImages[tileValue];
      if (!imageUrl) continue;

      try {
        const s3ImageUrl = await downloadAndUploadToS3(
          imageUrl,
          `themes/${uuid}/${title}`,
          tileValue
        );

        // Find the tile prompt for description
        const tilePrompt = tilePrompts.find((t: any) => t.value === tileValue);
        tileData[tileValue.toString()] = {
          image: s3ImageUrl,
          description: tilePrompt?.description || ''
        };

        uploadedImages++;
        const progress = Math.floor((uploadedImages / totalImages) * 100);
        
        res.write(`data: ${JSON.stringify({
          status: 'uploading',
          progress,
          message: `Uploaded ${uploadedImages} of ${totalImages} images`
        })}\n\n`);
      } catch (error) {
        Logger.error(`Failed to process image for tile ${tileValue}:`, error);
        // Continue with other images even if one fails
      }
    }

    // Send update that we're saving to database
    res.write(`data: ${JSON.stringify({
      status: 'saving',
      message: 'All images uploaded. Saving theme to database...'
    })}\n\n`);

    // Create theme data structure matching ThemeEntity
    const themeData: any = {
      title,
      description: description || '',
      visibility: visibility || 'private',
      price: (visibility === 'premium' && price) ? parseFloat(price) : 0,
      numberDisplay: numberDisplay?.show || false,
      position: numberDisplay?.position || 'center',
      numberColor: numberDisplay?.color || '#ffffff',
      numberSize: numberDisplay?.size || 16,
      creator_id: req.user.address,
    };

    // Add tile images (using same structure as createTheme)
    const allTileValues = ['2', '4', '8', '16', '32', '64', '128', '256', '512', '1024', '2048', '4096', '8192', '16384', '32768', '65536'];
    for (const tileValue of allTileValues) {
      const tileInfo = tileData[tileValue];
      if (tileInfo && tileInfo.image) {
        themeData[tileValue] = {
          sm: tileInfo.image,
          lg: tileInfo.image,
          description: tileInfo.description || ''
        };
      } else {
        themeData[tileValue] = {
          sm: '',
          lg: '',
          description: ''
        };
      }
    }

    // Save theme to database
    const theme = await themeService.createTheme(uuid, themeData);

    // Send final success response
    res.write(`data: ${JSON.stringify({
      status: 'complete',
      progress: 100,
      message: 'Theme created successfully',
      theme
    })}\n\n`);

    res.end();
  } catch (error) {
    Logger.error("Error creating AI theme:", error);
    res.write(`data: ${JSON.stringify({
      status: 'error',
      message: 'Failed to create theme',
      error: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);
    res.end();
  }
};

export const createAIThemeController = errorHandlerWrapper(createAIThemeHandler);

