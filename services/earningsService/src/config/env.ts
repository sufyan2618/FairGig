import dotenv from 'dotenv';

dotenv.config();

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  accessTokenSecret: required('ACCESS_TOKEN_SECRET', process.env.AUTH_ACCESS_TOKEN_SECRET),
  internalServiceApiKey: required('INTERNAL_SERVICE_API_KEY', 'fairgig-internal-dev-key'),
  awsRegion: required('AWS_REGION'),
  awsAccessKeyId: required('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
  awsS3BucketName: required('AWS_S3_BUCKET_NAME'),
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? null,
  maxScreenshotSizeBytes: Number.parseInt(process.env.MAX_SCREENSHOT_SIZE_BYTES ?? `${5 * 1024 * 1024}`, 10),
  maxCsvSizeBytes: Number.parseInt(process.env.MAX_CSV_SIZE_BYTES ?? `${2 * 1024 * 1024}`, 10),
};
