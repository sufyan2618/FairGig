import { raise } from './errors.js';

export const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

export const parseDateIso = (value: string | undefined, fieldName: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    raise(400, 'VALIDATION_ERROR', `${fieldName} must be a valid date.`);
  }

  return date.toISOString().slice(0, 10);
};

export const parseHoursWorkedMinutes = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numeric) || numeric <= 0) {
    raise(400, 'VALIDATION_ERROR', 'hours_worked must be a positive number.');
  }

  const minutes = Math.round(numeric * 60);
  if (minutes < 1) {
    raise(400, 'VALIDATION_ERROR', 'hours_worked is too small.');
  }
  return minutes;
};

export const minutesToHours = (minutes: number): number => {
  return Math.round((minutes / 60) * 100) / 100;
};

export const parseAmount = (value: unknown, fieldName: string): number => {
  const amount = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (Number.isNaN(amount) || amount < 0) {
    raise(400, 'VALIDATION_ERROR', `${fieldName} must be a non-negative integer.`);
  }
  return amount;
};

export const sanitizeText = (value: unknown, fieldName: string, maxLen = 255): string => {
  if (typeof value !== 'string') {
    raise(400, 'VALIDATION_ERROR', `${fieldName} must be a string.`);
  }

  const trimmed = (value as string).trim();
  if (!trimmed) {
    raise(400, 'VALIDATION_ERROR', `${fieldName} is required.`);
  }

  if (trimmed.length > maxLen) {
    raise(400, 'VALIDATION_ERROR', `${fieldName} exceeds maximum length of ${maxLen}.`);
  }

  return trimmed;
};
