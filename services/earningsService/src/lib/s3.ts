import crypto from 'node:crypto';
import path from 'node:path';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '../config/env.js';

const s3Client = new S3Client({
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
  },
});

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const getS3PublicBaseUrl = (): string => {
  if (env.s3PublicBaseUrl) {
    return trimTrailingSlash(env.s3PublicBaseUrl);
  }
  return `https://${env.awsS3BucketName}.s3.${env.awsRegion}.amazonaws.com`;
};

const safeImageExtension = (file: Express.Multer.File): string => {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName === '.jpg' || fromName === '.jpeg' || fromName === '.png') {
    return fromName;
  }
  return file.mimetype === 'image/png' ? '.png' : '.jpg';
};

const createScreenshotObjectKey = (workerId: string, shiftId: string, file: Express.Multer.File): string => {
  const random = crypto.randomBytes(16).toString('hex');
  const extension = safeImageExtension(file);
  return `screenshots/${workerId}/${shiftId}-${Date.now()}-${random}${extension}`;
};

export const uploadScreenshotToS3 = async (
  workerId: string,
  shiftId: string,
  file: Express.Multer.File,
): Promise<{ objectKey: string; publicUrl: string }> => {
  if (!file.buffer) {
    throw new Error('Screenshot buffer is missing for S3 upload.');
  }

  const objectKey = createScreenshotObjectKey(workerId, shiftId, file);

  await s3Client.send(new PutObjectCommand({
    Bucket: env.awsS3BucketName,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return {
    objectKey,
    publicUrl: `${getS3PublicBaseUrl()}/${objectKey}`,
  };
};

export const deleteS3ObjectIfExists = async (objectKey: string | null | undefined): Promise<void> => {
  if (!objectKey) {
    return;
  }

  const key = objectKey.trim();
  if (!key) {
    return;
  }

  await s3Client.send(new DeleteObjectCommand({
    Bucket: env.awsS3BucketName,
    Key: key,
  }));
};
