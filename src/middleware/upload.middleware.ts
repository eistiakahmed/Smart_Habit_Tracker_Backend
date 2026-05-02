import { Request, Response, NextFunction } from 'express';
import upload, { uploadToCloudinary } from '@/utils/upload';
import logger from '@/utils/logger';

export const singleUpload = (fieldName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single(fieldName);

    uploadSingle(req, res, async (err) => {
      if (err) {
        logger.error('File upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }

      try {
        if (req.file) {
          const imageUrl = await uploadToCloudinary(req.file);
          req.body.avatar = imageUrl;
          req.body.fileUploaded = true;
        }

        if (req.body.data) {
          try {
            const parsedData = JSON.parse(req.body.data);
            Object.assign(req.body, parsedData);
          } catch (e) {
            // If not valid JSON, keep as is
          }
        }

        next();
      } catch (error: any) {
        logger.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload image',
        });
      }
    });
  };
};

export default singleUpload;
