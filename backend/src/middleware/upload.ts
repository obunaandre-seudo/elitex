import multer from 'multer';
import { AppError } from './errorHandler';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new AppError('Only JPEG, PNG, and WebP product images are allowed.', 400));
    }

    callback(null, true);
  },
});
