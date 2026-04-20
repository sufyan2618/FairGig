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

const normalizeForwardedValue = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  return value.split(',')[0]?.trim() || null;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const isInternalHostname = (hostname: string): boolean => {
  return (
    hostname === 'earnings-service'
    || hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '0.0.0.0'
  );
};

export const getPublicRequestOrigin = (
  reqProtocol: string,
  reqHost: string,
  forwardedProto?: string | null,
  forwardedHost?: string | null,
): string => {
  const proto = normalizeForwardedValue(forwardedProto) || reqProtocol || 'http';
  const host = normalizeForwardedValue(forwardedHost) || reqHost || 'localhost:8080';
  return `${proto}://${trimTrailingSlash(host)}`;
};

export const buildScreenshotPublicUrl = (origin: string, fileName: string): string => {
  return `${trimTrailingSlash(origin)}/uploads/screenshots/${fileName}`;
};

export const normalizeScreenshotPublicUrl = (url: string | null, publicOrigin: string): string | null => {
  if (!url) {
    return null;
  }

  if (url.startsWith('/uploads/')) {
    return `${trimTrailingSlash(publicOrigin)}${url}`;
  }

  try {
    const parsed = new URL(url);
    if (isInternalHostname(parsed.hostname)) {
      return `${trimTrailingSlash(publicOrigin)}${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
};
