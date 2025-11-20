import { themeService } from "../../services";
import { errorHandlerWrapper, Logger } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { ThemeEntity } from "entities";

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Use memory storage for multer (files will be in buffer memory before uploading to S3)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file
    fieldSize: 50 * 1024 * 1024, // 50MB for field values
    fields: 100, // Max number of non-file fields
    files: 100, // Max number of files
    fieldNameSize: 100, // Max field name size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).any();

// Helper function to upload a file to S3
async function uploadFileToS3(file: Express.Multer.File, path: string): Promise<string> {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${path}/${uuidv4()}.${fileExtension}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || 'evofuse2048',
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });
  
  await s3Client.send(command);
  
  // Return the URL to the uploaded file
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

const createThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Use multer to process the multipart form data
  upload(req, res, async (err) => {
    if (err) {
      return res.status(httpStatus.BAD_REQUEST).json({ 
        error: true, 
        message: err.message 
      });
    }

    try {
      const { uuid } = req.user;
      
      // Extract form fields
      const title = req.body.title;
      const visibility = req.body.visibility;
      const price = req.body.price ? parseFloat(req.body.price) : 0;
      const numberDisplay = JSON.parse(req.body.numberDisplay || '{}');
      
      // Process tile images and descriptions
      const tileData: Record<string, any> = {};
      const files = req.files as Express.Multer.File[];
      
      // Set up SSE headers for progress updates
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Upload all image files to S3 and organize by tile value
      const totalFiles = files.length;
      let uploadedFiles = 0;
      
      for (const file of files) {
        const match = file.fieldname.match(/tileImage_(\d+)/);
        if (match) {
          const tileValue = parseInt(match[1]);
          if (!tileData[tileValue]) tileData[tileValue] = {};
          
          // Upload the file to S3 and get the URL
          const imageUrl = await uploadFileToS3(file, `themes/${uuid}/${title}`);
          tileData[tileValue].image = imageUrl;
          
          // Send progress update
          uploadedFiles++;
          res.write(`data: ${JSON.stringify({
            status: 'uploading',
            progress: Math.floor((uploadedFiles / totalFiles) * 100),
            message: `Uploaded ${uploadedFiles} of ${totalFiles} images`
          })}\n\n`);
        }
      }
      
      // Send update that we're saving to database
      res.write(`data: ${JSON.stringify({
        status: 'saving',
        message: 'All images uploaded. Saving theme to database...'
      })}\n\n`);
      
      // Extract tile descriptions from form data
      Object.keys(req.body).forEach(key => {
        const match = key.match(/tileDescription_(\d+)/);
        if (match) {
          const tileValue = parseInt(match[1]);
          if (!tileData[tileValue]) tileData[tileValue] = {};
          tileData[tileValue].description = req.body[key];
        }
      });
      
      // Create a theme object that matches ThemeEntity structure
      const themeData = {
        title,
        visibility,
        price: visibility === 'premium' ? price : 0,
        numberDisplay: numberDisplay.show,
        position: numberDisplay.position,
        numberColor: numberDisplay.color,
        numberSize: numberDisplay.size,
        description: req.body.description || '',
        '2': {"sm": tileData['2']?.image || '', "lg": tileData['2']?.image || '', description: tileData['2']?.description || ""},
        '4': {"sm": tileData['4']?.image || '', "lg": tileData['4']?.image || '', description: tileData['4']?.description || ""},
        '8': {"sm": tileData['8']?.image || '', "lg": tileData['8']?.image || '', description: tileData['8']?.description || ""},
        '16': {"sm": tileData['16']?.image || '', "lg": tileData['16']?.image || '', description: tileData['16']?.description || ""},
        '32': {"sm": tileData['32']?.image || '', "lg": tileData['32']?.image || '', description: tileData['32']?.description || ""},
        '64': {"sm": tileData['64']?.image || '', "lg": tileData['64']?.image || '', description: tileData['64']?.description || ""},
        '128': {"sm": tileData['128']?.image || '', "lg": tileData['128']?.image || '', description: tileData['128']?.description || ""},
        '256': {"sm": tileData['256']?.image || '', "lg": tileData['256']?.image || '', description: tileData['256']?.description || ""},
        '512': {"sm": tileData['512']?.image || '', "lg": tileData['512']?.image || '', description: tileData['512']?.description || ""},
        '1024': {"sm": tileData['1024']?.image || '', "lg": tileData['1024']?.image || '', description: tileData['1024']?.description || ""},
        '2048': {"sm": tileData['2048']?.image || '', "lg": tileData['2048']?.image || '', description: tileData['2048']?.description || ""},
        '4096': {"sm": tileData['4096']?.image || '', "lg": tileData['4096']?.image || '', description: tileData['4096']?.description || ""},
        '8192': {"sm": tileData['8192']?.image || '', "lg": tileData['8192']?.image || '', description: tileData['8192']?.description || ""},
        '16384': {"sm": tileData['16384']?.image || '', "lg": tileData['16384']?.image || '', description: tileData['16384']?.description || ""},
        '32768': {"sm": tileData['32768']?.image || '', "lg": tileData['32768']?.image || '', description: tileData['32768']?.description || ""},
        '65536': {"sm": tileData['65536']?.image || '', "lg": tileData['65536']?.image || '', description: tileData['65536']?.description || ""},
        creator_id: req.user.address,
      };
      
      const theme = await themeService.createTheme(uuid, themeData);
      
      // Send final success response
      res.write(`data: ${JSON.stringify({
        status: 'complete',
        message: 'Theme created successfully',
        theme
      })}\n\n`);
      
      res.end();
    } catch (error) {
      console.error("Error creating theme:", error);
      res.write(`data: ${JSON.stringify({
        status: 'error',
        message: 'Failed to create theme'
      })}\n\n`);
      res.end();
    }
  });
};

export const createThemeController = errorHandlerWrapper(createThemeHandler);
