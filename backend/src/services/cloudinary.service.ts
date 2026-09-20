import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface UploadedCloudinaryImage {
  secureUrl: string;
  publicId: string;
}

let configured = false;

function ensureCloudinaryConfigured() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new AppError('Cloudinary image upload is not configured.', 503);
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
  }
}

function uploadBuffer(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed.'));
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

export async function uploadProductImages(files: Express.Multer.File[], folderKey: string): Promise<UploadedCloudinaryImage[]> {
  const folder = `elite-x-shop/products/${folderKey}`;
  const uploaded: UploadedCloudinaryImage[] = [];

  try {
    for (const file of files) {
      const result = await uploadBuffer(file.buffer, folder);
      uploaded.push({
        secureUrl: result.secure_url,
        publicId: result.public_id,
      });
    }

    return uploaded;
  } catch (err) {
    await deleteCloudinaryImages(uploaded.map((image) => image.publicId));
    throw err;
  }
}

export async function deleteCloudinaryImages(publicIds: string[]) {
  const ids = publicIds.filter(Boolean);
  if (!ids.length) return;

  ensureCloudinaryConfigured();
  await Promise.allSettled(ids.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: 'image' })));
}
