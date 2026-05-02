import multer from 'multer';
import { Request } from 'express';
import cloudinary from '@/config/cloudinary';
import { cloudinaryConfig } from '@/config/cloudinary';
import logger from '@/utils/logger';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = cloudinaryConfig.folder
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      }
    );

    logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);
    return result.secure_url;
  } catch (error: any) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted from Cloudinary: ${publicId}`);
    }
  } catch (error: any) {
    logger.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const matches = url.match(/\/v\d+\/(.+?\.[a-z]{3,4})$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
};

export default upload;
