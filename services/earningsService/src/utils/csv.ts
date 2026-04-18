import { Readable } from 'node:stream';

import csv from 'csv-parser';

import type { ShiftBody } from '../types/earnings.js';
import { parseAmount, parseDateIso, parseHoursWorkedMinutes, sanitizeText } from './validation.js';

export interface CsvImportFailure {
  row: number;
  reason: string;
}

export interface ParsedCsvResult {
  parsed: ShiftBody[];
  failures: CsvImportFailure[];
  totalRows: number;
}

const requiredColumns = ['platform', 'date', 'hours_worked', 'gross_earned', 'deductions', 'net_received'];

export const createTemplateCsv = (): string => {
  return `${requiredColumns.join(',')}\n`;
};

export const parseCsvBuffer = async (buffer: Buffer): Promise<ParsedCsvResult> => {
  const parsed: ShiftBody[] = [];
  const failures: CsvImportFailure[] = [];
  let totalRows = 0;

  await new Promise<void>((resolve, reject) => {
    const rows: Record<string, string>[] = [];

    Readable.from(buffer)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', () => {
        rows.forEach((row, index) => {
          const rowNumber = index + 1;
          totalRows += 1;

          try {
            const platform = sanitizeText(row.platform, 'platform', 80);
            const date = parseDateIso(row.date, 'date');
            if (!date) {
              throw new Error('date is required');
            }

            const hoursWorkedMinutes = parseHoursWorkedMinutes(row.hours_worked);
            const grossEarned = parseAmount(row.gross_earned, 'gross_earned');
            const deductions = parseAmount(row.deductions, 'deductions');
            const netReceived = parseAmount(row.net_received, 'net_received');

            parsed.push({
              platform,
              date,
              hours_worked: hoursWorkedMinutes / 60,
              gross_earned: grossEarned,
              deductions,
              net_received: netReceived,
              worker_category: row.worker_category?.trim() || undefined,
              city_zone: row.city_zone?.trim() || undefined,
            });
          } catch (error) {
            const reason = error instanceof Error ? error.message : 'Invalid CSV row format';
            failures.push({ row: rowNumber, reason });
          }
        });

        resolve();
      });
  });

  return {
    parsed,
    failures,
    totalRows,
  };
};
