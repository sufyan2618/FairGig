import type { Request, Response } from 'express';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { shiftLogsTable } from '../db/schema.js';
import { db } from '../lib/db.js';
import type { ShiftBody } from '../types/earnings.js';
import { createTemplateCsv, parseCsvBuffer } from '../utils/csv.js';
import { raise } from '../utils/errors.js';
import {
  buildScreenshotPublicUrl,
  getPublicRequestOrigin,
  normalizeScreenshotPublicUrl,
  removeFileIfExists,
} from '../utils/files.js';
import {
  isUuid,
  minutesToHours,
  parseAmount,
  parseDateIso,
  parseHoursWorkedMinutes,
  parsePositiveInt,
  sanitizeText,
} from '../utils/validation.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type ShiftStatus = typeof shiftLogsTable.$inferSelect.verificationStatus;

type ShiftResponse = {
  id: string;
  worker_id: string;
  platform: string;
  date: string;
  hours_worked: number;
  gross_earned: number;
  deductions: number;
  net_received: number;
  worker_category: string | null;
  city_zone: string | null;
  verification_status: ShiftStatus;
  verification_note: string | null;
  screenshot_url: string | null;
  submitted_at: Date;
  verified_at: Date | null;
  verified_by: string | null;
  created_at: Date;
  updated_at: Date;
};

const mustExist = <T>(value: T, status: number, code: string, message: string): NonNullable<T> => {
  if (value === undefined || value === null) {
    raise(status, code, message);
  }
  return value as NonNullable<T>;
};

const getPathParam = (req: Request, name: string): string => {
  const raw = req.params[name];
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && first.trim()) {
      return first;
    }
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  raise(400, 'VALIDATION_ERROR', `${name} path parameter is required.`);
  return '';
};

const getSingleQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
};

const assertWorkerUser = (req: Request): string => {
  const authUser = mustExist(req.authUser, 401, 'UNAUTHORIZED', 'Authentication is required.');
  if (authUser.role !== 'worker') {
    raise(403, 'FORBIDDEN', 'Only workers can access this endpoint.');
  }
  return authUser.id;
};

const parseShiftBody = (body: ShiftBody) => {
  const platform = sanitizeText(body.platform, 'platform', 80);
  const shiftDate = parseDateIso(body.date, 'date');
  const shiftDateValue = mustExist(shiftDate, 400, 'VALIDATION_ERROR', 'date is required.');

  return {
    platform,
    shiftDate: shiftDateValue,
    hoursWorkedMinutes: parseHoursWorkedMinutes(body.hours_worked),
    grossEarned: parseAmount(body.gross_earned, 'gross_earned'),
    platformDeductions: parseAmount(body.deductions, 'deductions'),
    netReceived: parseAmount(body.net_received, 'net_received'),
    workerCategory: body.worker_category?.trim() || null,
    cityZone: body.city_zone?.trim() || null,
  };
};

const toShiftResponse = (shift: typeof shiftLogsTable.$inferSelect): ShiftResponse => ({
  id: shift.id,
  worker_id: shift.workerId,
  platform: shift.platform,
  date: shift.shiftDate,
  hours_worked: minutesToHours(shift.hoursWorkedMinutes),
  gross_earned: shift.grossEarned,
  deductions: shift.platformDeductions,
  net_received: shift.netReceived,
  worker_category: shift.workerCategory,
  city_zone: shift.cityZone,
  verification_status: shift.verificationStatus,
  verification_note: shift.verificationNote,
  screenshot_url: shift.screenshotUrl,
  submitted_at: shift.submittedAt,
  verified_at: shift.verifiedAt,
  verified_by: shift.verifiedById,
  created_at: shift.createdAt,
  updated_at: shift.updatedAt,
});

export const createShift = async (req: Request, res: Response): Promise<void> => {
  const workerId = assertWorkerUser(req);
  const parsed = parseShiftBody(req.body as ShiftBody);

  const createdRows = await db
    .insert(shiftLogsTable)
    .values({
      workerId,
      ...parsed,
      verificationStatus: 'pending',
    })
    .returning();

  const created = mustExist(createdRows[0], 500, 'INTERNAL_SERVER_ERROR', 'Failed to create shift log.');

  res.status(201).json({ data: toShiftResponse(created) });
};

export const listShifts = async (req: Request, res: Response): Promise<void> => {
  const isInternal = Boolean(req.isInternalService);
  const page = parsePositiveInt(getSingleQueryValue(req.query.page), DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInt(getSingleQueryValue(req.query.limit), DEFAULT_LIMIT), MAX_LIMIT);

  const selectedWorkerId = isInternal ? getSingleQueryValue(req.query.worker_id) : req.authUser?.id;
  if (!selectedWorkerId) {
    raise(400, 'VALIDATION_ERROR', 'worker_id query parameter is required for internal requests.');
  }
  const workerId = selectedWorkerId as string;

  if (!isUuid(workerId)) {
    if (isInternal) {
      raise(400, 'VALIDATION_ERROR', 'worker_id must be a valid UUID for internal requests.');
    }

    raise(401, 'UNAUTHORIZED', 'Invalid token subject format. Please sign in again.');
  }

  const filters = [
    eq(shiftLogsTable.workerId, workerId),
    sql`${shiftLogsTable.deletedAt} IS NULL`,
  ];

  const platform = getSingleQueryValue(req.query.platform)?.trim();
  if (platform) {
    filters.push(eq(shiftLogsTable.platform, platform));
  }

  const dateFrom = parseDateIso(getSingleQueryValue(req.query.date_from), 'date_from');
  if (dateFrom) {
    filters.push(gte(shiftLogsTable.shiftDate, dateFrom));
  }

  const dateTo = parseDateIso(getSingleQueryValue(req.query.date_to), 'date_to');
  if (dateTo) {
    filters.push(lte(shiftLogsTable.shiftDate, dateTo));
  }

  const statusFilter = getSingleQueryValue(req.query.verification_status)?.trim();
  if (statusFilter) {
    filters.push(eq(shiftLogsTable.verificationStatus, statusFilter as ShiftStatus));
  }

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(shiftLogsTable)
      .where(and(...filters))
      .orderBy(desc(shiftLogsTable.submittedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(shiftLogsTable)
      .where(and(...filters)),
  ]);

  const total = totalRows[0]?.total ?? 0;

  res.status(200).json({
    data: items.map(toShiftResponse),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
};

export const getShiftById = async (req: Request, res: Response): Promise<void> => {
  const workerId = assertWorkerUser(req);
  const shiftId = getPathParam(req, 'id');

  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), eq(shiftLogsTable.workerId, workerId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const shift = mustExist(rows[0], 404, 'SHIFT_NOT_FOUND', 'Shift log not found.');

  res.status(200).json({ data: toShiftResponse(shift) });
};

export const updateShift = async (req: Request, res: Response): Promise<void> => {
  const workerId = assertWorkerUser(req);
  const shiftId = getPathParam(req, 'id');

  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), eq(shiftLogsTable.workerId, workerId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const existing = mustExist(rows[0], 404, 'SHIFT_NOT_FOUND', 'Shift log not found.');

  if (existing.verificationStatus !== 'pending') {
    raise(403, 'SHIFT_LOCKED', 'This shift log cannot be edited after verification workflow starts.');
  }

  const parsed = parseShiftBody(req.body as ShiftBody);
  const updatedRows = await db
    .update(shiftLogsTable)
    .set({
      ...parsed,
      updatedAt: new Date(),
    })
    .where(eq(shiftLogsTable.id, shiftId))
    .returning();

  const updated = mustExist(updatedRows[0], 500, 'INTERNAL_SERVER_ERROR', 'Failed to update shift log.');

  res.status(200).json({ data: toShiftResponse(updated) });
};

export const deleteShift = async (req: Request, res: Response): Promise<void> => {
  const workerId = assertWorkerUser(req);
  const shiftId = getPathParam(req, 'id');

  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), eq(shiftLogsTable.workerId, workerId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const existing = mustExist(rows[0], 404, 'SHIFT_NOT_FOUND', 'Shift log not found.');

  if (existing.verificationStatus !== 'pending') {
    raise(403, 'SHIFT_LOCKED', 'This shift log cannot be deleted after verification workflow starts.');
  }

  if (existing.screenshotUrl) {
    raise(403, 'SHIFT_LOCKED', 'This shift log cannot be deleted after screenshot upload.');
  }

  await db
    .update(shiftLogsTable)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(shiftLogsTable.id, shiftId));

  res.status(200).json({ message: 'Shift log deleted successfully.' });
};

export const importShiftsCsv = async (req: Request, res: Response): Promise<void> => {
  const workerId = assertWorkerUser(req);
  const uploadFile = req.file;

  if (!uploadFile || !uploadFile.buffer) {
    raise(400, 'INVALID_CSV_FORMAT', 'CSV file is required.');
  }
  const file = uploadFile as Express.Multer.File;

  const parsed = await parseCsvBuffer(file.buffer);

  if (parsed.failures.length > 0) {
    const failurePreview = parsed.failures
      .slice(0, 3)
      .map((failure) => `row ${failure.row}: ${failure.reason}`)
      .join('; ');

    res.status(400).json({
      error: 'INVALID_CSV_FORMAT',
      message: `CSV validation failed. ${failurePreview}${parsed.failures.length > 3 ? ' ...' : ''}`,
      status: 400,
      summary: {
        total_rows: parsed.totalRows,
        imported: 0,
        failed: parsed.failures.length,
        failures: parsed.failures,
      },
    });
    return;
  }

  if (parsed.parsed.length === 0) {
    raise(400, 'INVALID_CSV_FORMAT', 'CSV file does not contain valid rows.');
  }

  await db.transaction(async (tx) => {
    await tx.insert(shiftLogsTable).values(
      parsed.parsed.map((row) => ({
        workerId,
        platform: row.platform,
        shiftDate: mustExist(parseDateIso(row.date, 'date'), 400, 'VALIDATION_ERROR', 'date is required'),
        hoursWorkedMinutes: parseHoursWorkedMinutes(row.hours_worked),
        grossEarned: parseAmount(row.gross_earned, 'gross_earned'),
        platformDeductions: parseAmount(row.deductions, 'deductions'),
        netReceived: parseAmount(row.net_received, 'net_received'),
        workerCategory: row.worker_category ?? null,
        cityZone: row.city_zone ?? null,
        verificationStatus: 'pending' as const,
      })),
    );
  });

  res.status(201).json({
    summary: {
      total_rows: parsed.totalRows,
      imported: parsed.parsed.length,
      failed: 0,
      failures: [],
    },
  });
};

export const downloadCsvTemplate = async (_req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="shift_import_template.csv"');
  res.status(200).send(createTemplateCsv());
};

export const uploadShiftScreenshot = async (req: Request, res: Response): Promise<void> => {
  const workerId = assertWorkerUser(req);
  const shiftId = getPathParam(req, 'id');
  const uploadFile = req.file;

  if (!uploadFile) {
    raise(400, 'VALIDATION_ERROR', 'Screenshot file is required.');
  }
  const file = uploadFile as Express.Multer.File;

  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), eq(shiftLogsTable.workerId, workerId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const existing = rows[0];
  if (!existing) {
    removeFileIfExists(file.path);
    raise(404, 'SHIFT_NOT_FOUND', 'Shift log not found.');
  }
  const currentShift = existing as typeof shiftLogsTable.$inferSelect;

  if (currentShift.verificationStatus === 'verified' || currentShift.verificationStatus === 'flagged' || currentShift.verificationStatus === 'unverifiable') {
    removeFileIfExists(file.path);
    raise(403, 'SHIFT_LOCKED', 'This shift log is locked and cannot accept new screenshots.');
  }

  const publicOrigin = getPublicRequestOrigin(
    req.protocol,
    req.get('host') || 'localhost:3001',
    req.get('x-forwarded-proto'),
    req.get('x-forwarded-host'),
  );
  const publicUrl = buildScreenshotPublicUrl(publicOrigin, file.filename);
  const updatedRows = await db
    .update(shiftLogsTable)
    .set({
      screenshotUrl: publicUrl,
      screenshotStoragePath: file.path,
      verificationStatus: 'pending_review',
      updatedAt: new Date(),
    })
    .where(eq(shiftLogsTable.id, shiftId))
    .returning();

  const updated = mustExist(updatedRows[0], 500, 'INTERNAL_SERVER_ERROR', 'Failed to update screenshot for shift log.');

  if (currentShift.screenshotStoragePath && currentShift.screenshotStoragePath !== file.path) {
    removeFileIfExists(currentShift.screenshotStoragePath);
  }

  res.status(200).json({
    data: toShiftResponse(updated),
    message: 'Screenshot uploaded successfully.',
  });
};

export const getShiftScreenshot = async (req: Request, res: Response): Promise<void> => {
  const authUser = mustExist(req.authUser, 401, 'UNAUTHORIZED', 'Unauthorized request.');

  const shiftId = getPathParam(req, 'id');
  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const shift = mustExist(rows[0], 404, 'SHIFT_NOT_FOUND', 'Shift log not found.');

  if (authUser.role === 'worker' && shift.workerId !== authUser.id) {
    raise(403, 'FORBIDDEN', 'Workers can only access their own screenshots.');
  }

  if (authUser.role === 'verifier' && shift.verificationStatus !== 'pending_review') {
    raise(403, 'FORBIDDEN', 'Verifiers can only access pending review screenshots.');
  }

  if (!shift.screenshotUrl) {
    raise(404, 'SCREENSHOT_NOT_FOUND', 'Screenshot not found for this shift log.');
  }

  const publicOrigin = getPublicRequestOrigin(
    req.protocol,
    req.get('host') || 'localhost:3001',
    req.get('x-forwarded-proto'),
    req.get('x-forwarded-host'),
  );

  res.status(200).json({
    shift_id: shift.id,
    verification_status: shift.verificationStatus,
    screenshot_url: normalizeScreenshotPublicUrl(shift.screenshotUrl, publicOrigin),
  });
};
