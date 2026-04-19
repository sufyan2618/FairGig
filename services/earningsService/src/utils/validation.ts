import { raise } from './errors.js';

const UUID_V4_OR_GENERIC_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID_V4_OR_GENERIC_REGEX.test(value);

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

  const rawValue = value.trim();
  if (!rawValue) {
    return undefined;
  }

  const acceptedFormatsMessage =
    `${fieldName} must be a valid date. Accepted formats: ` +
    'YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, DD-MM-YY.';

  const buildIsoDate = (year: number, month: number, day: number): string => {
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
      candidate.getUTCFullYear() !== year ||
      candidate.getUTCMonth() + 1 !== month ||
      candidate.getUTCDate() !== day
    ) {
      raise(400, 'VALIDATION_ERROR', acceptedFormatsMessage);
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Year-first formats: YYYY-MM-DD or YYYY/MM/DD
  const yearFirstMatch = rawValue.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yearFirstMatch) {
    const year = Number.parseInt(yearFirstMatch[1] ?? '', 10);
    const month = Number.parseInt(yearFirstMatch[2] ?? '', 10);
    const day = Number.parseInt(yearFirstMatch[3] ?? '', 10);
    return buildIsoDate(year, month, day);
  }

  // Day-first formats: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, DD-MM-YY
  const dayFirstMatch = rawValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (dayFirstMatch) {
    const day = Number.parseInt(dayFirstMatch[1] ?? '', 10);
    const month = Number.parseInt(dayFirstMatch[2] ?? '', 10);
    const parsedYear = Number.parseInt(dayFirstMatch[3] ?? '', 10);
    const year = (dayFirstMatch[3] ?? '').length === 2 ? 2000 + parsedYear : parsedYear;
    return buildIsoDate(year, month, day);
  }

  // Keep compatibility for explicit ISO date-time input.
  if (/^\d{4}-\d{2}-\d{2}T/.test(rawValue)) {
    const isoDateTime = new Date(rawValue);
    if (!Number.isNaN(isoDateTime.getTime())) {
      return isoDateTime.toISOString().slice(0, 10);
    }
  }

  raise(400, 'VALIDATION_ERROR', acceptedFormatsMessage);
  return undefined;
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
