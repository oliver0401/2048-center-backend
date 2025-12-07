import { Request, Response } from "express";
import { errorHandlerWrapper, Logger } from "../../utils";
import { updateUser } from "../../services/user.service";
import { NotFoundError } from "errors";
import { MESSAGE } from "consts";
import { httpStatus } from "types";
import multer from "multer";
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

// Use memory storage for multer
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('avatar');

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
  return `https://${process.env.AWS_S3_BUCKET_NAME || 'evofuse2048'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
}

const uploadAvatarHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(httpStatus.BAD_REQUEST).json({ 
        error: true, 
        message: err.message 
      });
    }

    try {
      const { uuid } = req.user;
      const file = req.file;

      if (!file) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
          error: true, 
          message: 'No file uploaded' 
        });
      }

      // Upload avatar to S3
      const avatarUrl = await uploadFileToS3(file, `avatars/${uuid}`);
      
      // Update user with avatar URL
      const user = await updateUser({ uuid, avatar: avatarUrl });
      if (!user) {
        throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
      }

      res.status(httpStatus.OK).json({ 
        success: true, 
        avatar: avatarUrl,
        user 
      });
    } catch (error) {
      Logger.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to upload avatar' 
      });
    }
  });
};

export const uploadAvatarController = errorHandlerWrapper(uploadAvatarHandler);

