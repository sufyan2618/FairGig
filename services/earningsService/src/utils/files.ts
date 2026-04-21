import multer from 'multer';

import { env } from '../config/env.js';

const allowedImageMimes = new Set(['image/jpeg', 'image/png']);

export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
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
