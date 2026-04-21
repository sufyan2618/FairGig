import type { Request, Response } from 'express';
import { and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

import { db } from '../lib/db.js';
import { shiftLogsTable, verificationDecisionsTable } from '../db/schema.js';
import type { VerificationDecisionBody } from '../types/earnings.js';
import { raise } from '../utils/errors.js';
import { parseDateIso, parsePositiveInt } from '../utils/validation.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

const anonymizedWorkerName = (workerId: string): string => {
  const digest = crypto.createHash('sha256').update(workerId).digest('hex').slice(0, 8);
  return `worker_${digest}`;
};

const ensureVerifier = (req: Request): string => {
  const authUser = mustExist(req.authUser, 401, 'UNAUTHORIZED', 'Authentication is required.');
  if (authUser.role !== 'verifier') {
    raise(403, 'FORBIDDEN', 'Only verifiers can access this endpoint.');
  }
  return authUser.id;
};

export const getVerificationQueue = async (req: Request, res: Response): Promise<void> => {
  ensureVerifier(req);

  const page = parsePositiveInt(getSingleQueryValue(req.query.page), DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInt(getSingleQueryValue(req.query.limit), DEFAULT_LIMIT), MAX_LIMIT);

  const filters = [
    eq(shiftLogsTable.verificationStatus, 'pending_review'),
    sql`${shiftLogsTable.deletedAt} IS NULL`,
    sql`${shiftLogsTable.screenshotUrl} IS NOT NULL`,
  ];

  const [items, totals] = await Promise.all([
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

  const total = totals[0]?.total ?? 0;

  res.status(200).json({
    data: items.map((item) => ({
      id: item.id,
      worker_id: item.workerId,
      worker_display_name: anonymizedWorkerName(item.workerId),
      platform: item.platform,
      date: item.shiftDate,
      submitted_at: item.submittedAt,
      verification_status: item.verificationStatus,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
};

export const getVerificationById = async (req: Request, res: Response): Promise<void> => {
  ensureVerifier(req);
  const shiftId = getPathParam(req, 'id');

  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const shift = mustExist(rows[0], 404, 'SHIFT_NOT_FOUND', 'Shift log not found.');

  if (shift.verificationStatus !== 'pending_review') {
    raise(403, 'SHIFT_LOCKED', 'This shift log is not available in verification queue.');
  }


  res.status(200).json({
    data: {
      id: shift.id,
      worker_id: shift.workerId,
      worker_display_name: anonymizedWorkerName(shift.workerId),
      platform: shift.platform,
      date: shift.shiftDate,
      hours_worked: Math.round((shift.hoursWorkedMinutes / 60) * 100) / 100,
      gross_earned: shift.grossEarned,
      deductions: shift.platformDeductions,
      net_received: shift.netReceived,
      screenshot_url: shift.screenshotUrl,
      verification_status: shift.verificationStatus,
      submitted_at: shift.submittedAt,
    },
  });
};

export const submitVerificationDecision = async (req: Request, res: Response): Promise<void> => {
  const verifierId = ensureVerifier(req);
  const shiftId = getPathParam(req, 'id');
  const { status, note } = req.body as VerificationDecisionBody;

  if (status !== 'verified' && status !== 'flagged' && status !== 'unverifiable') {
    raise(400, 'VALIDATION_ERROR', 'status must be one of verified, flagged, unverifiable.');
  }

  if (status === 'flagged' && (!note || !note.trim())) {
    raise(400, 'VALIDATION_ERROR', 'note is required when status is flagged.');
  }

  const rows = await db
    .select()
    .from(shiftLogsTable)
    .where(and(eq(shiftLogsTable.id, shiftId), sql`${shiftLogsTable.deletedAt} IS NULL`))
    .limit(1);

  const shift = mustExist(rows[0], 404, 'SHIFT_NOT_FOUND', 'Shift log not found.');

  if (shift.verificationStatus !== 'pending_review') {
    raise(403, 'SHIFT_LOCKED', 'Verification decision already completed for this shift log.');
  }

  const now = new Date();

  const updatedRows = await db
    .update(shiftLogsTable)
    .set({
      verificationStatus: status,
      verificationNote: note?.trim() || null,
      verifiedById: verifierId,
      verifiedAt: now,
      updatedAt: now,
    })
    .where(eq(shiftLogsTable.id, shiftId))
    .returning();

  const updated = mustExist(updatedRows[0], 500, 'INTERNAL_SERVER_ERROR', 'Failed to update verification status.');

  await db.insert(verificationDecisionsTable).values({
    shiftId,
    verifierId,
    decisionStatus: status,
    note: note?.trim() || null,
    decidedAt: now,
  });

  res.status(200).json({
    data: {
      id: updated.id,
      verification_status: updated.verificationStatus,
      verification_note: updated.verificationNote,
      verified_by: updated.verifiedById,
      verified_at: updated.verifiedAt,
    },
    message: 'Verification decision submitted successfully.',
  });
};

export const getVerificationHistory = async (req: Request, res: Response): Promise<void> => {
  const verifierId = ensureVerifier(req);

  const page = parsePositiveInt(getSingleQueryValue(req.query.page), DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInt(getSingleQueryValue(req.query.limit), DEFAULT_LIMIT), MAX_LIMIT);

  const filters = [eq(verificationDecisionsTable.verifierId, verifierId)];

  const status = getSingleQueryValue(req.query.status)?.trim();
  if (status) {
    if (status !== 'verified' && status !== 'flagged' && status !== 'unverifiable') {
      raise(400, 'VALIDATION_ERROR', 'status filter must be verified, flagged, or unverifiable.');
    }
    filters.push(eq(verificationDecisionsTable.decisionStatus, status as 'verified' | 'flagged' | 'unverifiable'));
  }

  const dateFrom = parseDateIso(getSingleQueryValue(req.query.date_from), 'date_from');
  if (dateFrom) {
    filters.push(gte(verificationDecisionsTable.decidedAt, new Date(`${dateFrom}T00:00:00.000Z`)));
  }

  const dateTo = parseDateIso(getSingleQueryValue(req.query.date_to), 'date_to');
  if (dateTo) {
    filters.push(lte(verificationDecisionsTable.decidedAt, new Date(`${dateTo}T23:59:59.999Z`)));
  }

  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(verificationDecisionsTable)
      .where(and(...filters))
      .orderBy(desc(verificationDecisionsTable.decidedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(verificationDecisionsTable)
      .where(and(...filters)),
  ]);

  const shiftIds = rows.map((row) => row.shiftId);
  const shifts = shiftIds.length
    ? await db.select().from(shiftLogsTable).where(inArray(shiftLogsTable.id, shiftIds))
    : [];
  const shiftMap = new Map(shifts.map((shift) => [shift.id, shift]));

  const total = totals[0]?.total ?? 0;

  res.status(200).json({
    data: rows.map((row) => {
      const shift = shiftMap.get(row.shiftId);
      return {
        decision_id: row.id,
        shift_id: row.shiftId,
        decision_status: row.decisionStatus,
        note: row.note,
        decided_at: row.decidedAt,
        platform: shift?.platform ?? null,
        shift_date: shift?.shiftDate ?? null,
        worker_display_name: shift ? anonymizedWorkerName(shift.workerId) : null,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
};
