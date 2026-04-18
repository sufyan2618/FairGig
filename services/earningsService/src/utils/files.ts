import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import { env } from '../config/env.js';

const screenshotsDir = path.join(env.uploadsDir, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const allowedImageMimes = new Set(['image/jpeg', 'image/png']);

const screenshotStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, screenshotsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase() || (file.mimetype === 'image/png' ? '.png' : '.jpg');
    const hashed = crypto.randomBytes(32).toString('hex');
    cb(null, `${hashed}${extension}`);
  },
});

export const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: {
    fileSize: env.maxScreenshotSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageMimes.has(file.mimetype)) {
      cb(new Error('Screenshot must be a JPG or PNG image.'));
      return;
    }
    cb(null, true);
  },
});

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxCsvSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    const isCsv = file.mimetype.includes('csv') || file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      cb(new Error('Only .csv files are supported for import.'));
      return;
    }
    cb(null, true);
  },
});

export const removeFileIfExists = (filePath: string | null | undefined): void => {
  if (!filePath) {
    return;
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const buildScreenshotPublicUrl = (reqProtocol: string, reqHost: string, fileName: string): string => {
  return `${reqProtocol}://${reqHost}/uploads/screenshots/${fileName}`;
};
