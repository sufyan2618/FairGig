import crypto from 'node:crypto';

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

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

const optimizeScreenshotImage = async (
  file: Express.Multer.File,
): Promise<{ optimizedBuffer: Buffer; contentType: string; extension: string }> => {
  if (!file.buffer) {
    throw new Error('Screenshot buffer is missing for S3 upload.');
  }

  const optimizedBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: env.screenshotOptimizeMaxWidth,
      height: env.screenshotOptimizeMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: env.screenshotOptimizeWebpQuality })
    .toBuffer();

  return {
    optimizedBuffer,
    contentType: 'image/webp',
    extension: '.webp',
  };
};

const createScreenshotObjectKey = (workerId: string, shiftId: string, extension: string): string => {
  const random = crypto.randomBytes(16).toString('hex');
  return `screenshots/${workerId}/${shiftId}-${Date.now()}-${random}${extension}`;
};

const getSignedScreenshotUrl = async (objectKey: string): Promise<string> => {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: env.awsS3BucketName,
      Key: objectKey,
    }),
    {
      expiresIn: env.s3SignedUrlTtlSeconds,
    },
  );
};

export const uploadScreenshotToS3 = async (
  workerId: string,
  shiftId: string,
  file: Express.Multer.File,
): Promise<{ objectKey: string; publicUrl: string }> => {
  const { optimizedBuffer, contentType, extension } = await optimizeScreenshotImage(file);

  const objectKey = createScreenshotObjectKey(workerId, shiftId, extension);

  await s3Client.send(new PutObjectCommand({
    Bucket: env.awsS3BucketName,
    Key: objectKey,
    Body: optimizedBuffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
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

export const resolveScreenshotAccessUrl = async (
  screenshotUrl: string | null,
  screenshotStoragePath: string | null,
): Promise<string | null> => {
  if (!screenshotUrl) {
    return null;
  }

  if (!screenshotStoragePath) {
    return screenshotUrl;
  }

  try {
    return await getSignedScreenshotUrl(screenshotStoragePath);
  } catch {
    return screenshotUrl;
  }
};
