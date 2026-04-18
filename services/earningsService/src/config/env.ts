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
  uploadsDir: process.env.UPLOADS_DIR ?? 'uploads',
  maxScreenshotSizeBytes: Number.parseInt(process.env.MAX_SCREENSHOT_SIZE_BYTES ?? `${5 * 1024 * 1024}`, 10),
  maxCsvSizeBytes: Number.parseInt(process.env.MAX_CSV_SIZE_BYTES ?? `${2 * 1024 * 1024}`, 10),
};
