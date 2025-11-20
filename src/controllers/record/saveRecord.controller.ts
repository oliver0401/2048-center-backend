import { recordService } from "../../services/record.service";
import { errorHandlerWrapper, Logger } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Helper function to upload play history string to S3
async function uploadPlayHistoryToS3(playHistoryString: string, userId: string): Promise<string> {
  const fileName = `play-history/${userId}/${uuidv4()}.json`;
  
  // Convert string to buffer
  const buffer = Buffer.from(playHistoryString, 'utf8');
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || 'evofuse2048',
    Key: fileName,
    Body: buffer,
    ContentType: 'application/json',
  });
  
  await s3Client.send(command);
  
  // Return the URL to the uploaded file
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

const saveRecordHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid } = req.user;
  
  // Extract form fields
  const {
    date,
    move,
    score,
    rows,
    cols,
    playTime,
    playHistory
  } = req.body;

  // Validate required fields
  if (!date || !move || !score || !rows || !cols || !playTime) {
    throw new BadRequestError(MESSAGE.ERROR.MISSING_REQUIRED_FIELDS);
  }

  let playHistoryUrl: string | undefined;

  // Upload play history to S3 if provided
  if (playHistory && typeof playHistory === 'string' && playHistory.trim() !== '') {
    try {
      // Validate that playHistory is valid JSON
      JSON.parse(playHistory);
      
      // Log play history upload size
      const playHistorySizeBytes = Buffer.byteLength(playHistory, 'utf8');
      const playHistorySizeKB = (playHistorySizeBytes / 1024).toFixed(2);
      const playHistorySizeMB = (playHistorySizeBytes / (1024 * 1024)).toFixed(2);
      
      Logger.info('📤 Uploading Play History to S3');
      Logger.info(`   User: ${uuid}`);
      Logger.info(`   Size: ${playHistorySizeBytes} bytes (${playHistorySizeKB} KB / ${playHistorySizeMB} MB)`);
      
      playHistoryUrl = await uploadPlayHistoryToS3(playHistory, uuid);
      
      Logger.info(`   ✅ Successfully uploaded play history -> ${playHistoryUrl}`);
    } catch (error) {
      throw new BadRequestError("Play history must be valid JSON format");
    }
  }

  // Create record data
  const recordData = {
    user: req.user,
    date: new Date(date),
    move: parseInt(move),
    score: parseInt(score),
    rows: parseInt(rows),
    cols: parseInt(cols),
    playTime: parseInt(playTime),
    playHistoryUrl
  };

  // Save record to database
  const record = await recordService.saveRecord(recordData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORD_SAVED,
    record
  });
};

export const saveRecordController = errorHandlerWrapper(saveRecordHandler);
