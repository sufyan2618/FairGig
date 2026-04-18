import type { Request, Response } from 'express';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '../lib/db.js';
import { shiftLogsTable } from '../db/schema.js';
import { raise } from '../utils/errors.js';
import { isUuid, minutesToHours, parseDateIso } from '../utils/validation.js';

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

export const getWorkerSummary = async (req: Request, res: Response): Promise<void> => {
  const workerId = getPathParam(req, 'workerId');

  if (!isUuid(workerId)) {
    raise(400, 'VALIDATION_ERROR', 'workerId path parameter must be a valid UUID.');
  }

  const baseFilters = [
    eq(shiftLogsTable.workerId, workerId),
    sql`${shiftLogsTable.deletedAt} IS NULL`,
  ];

  const dateFrom = parseDateIso(getSingleQueryValue(req.query.date_from), 'date_from');
  if (dateFrom) {
    baseFilters.push(gte(shiftLogsTable.shiftDate, dateFrom));
  }

  const dateTo = parseDateIso(getSingleQueryValue(req.query.date_to), 'date_to');
  if (dateTo) {
    baseFilters.push(lte(shiftLogsTable.shiftDate, dateTo));
  }

  const verifiedFilters = [
    ...baseFilters,
    eq(shiftLogsTable.verificationStatus, 'verified'),
  ];

  const [shifts, statusRows] = await Promise.all([
    db
      .select()
      .from(shiftLogsTable)
      .where(and(...verifiedFilters))
      .orderBy(desc(shiftLogsTable.shiftDate)),
    db
      .select({
        verification_status: shiftLogsTable.verificationStatus,
        total: sql<number>`count(*)::int`,
      })
      .from(shiftLogsTable)
      .where(and(...baseFilters))
      .groupBy(shiftLogsTable.verificationStatus),
  ]);

  const statusBreakdown = statusRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.verification_status] = row.total;
    return acc;
  }, {});

  const totalShiftsInRange = statusRows.reduce((sum, row) => sum + row.total, 0);

  const totals = {
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
  };

  const breakdownMap = new Map<string, { total_gross: number; total_deductions: number; total_net: number; shifts_count: number }>();

  for (const shift of shifts) {
    totals.total_gross += shift.grossEarned;
    totals.total_deductions += shift.platformDeductions;
    totals.total_net += shift.netReceived;

    const existing = breakdownMap.get(shift.platform) ?? {
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      shifts_count: 0,
    };

    existing.total_gross += shift.grossEarned;
    existing.total_deductions += shift.platformDeductions;
    existing.total_net += shift.netReceived;
    existing.shifts_count += 1;

    breakdownMap.set(shift.platform, existing);
  }

  res.status(200).json({
    worker_id: workerId,
    date_from: dateFrom ?? null,
    date_to: dateTo ?? null,
    totals,
    total_shifts_in_range: totalShiftsInRange,
    status_breakdown: statusBreakdown,
    per_platform_breakdown: Array.from(breakdownMap.entries()).map(([platform, value]) => ({
      platform,
      ...value,
    })),
    verified_shifts: shifts.map((shift) => ({
      id: shift.id,
      platform: shift.platform,
      date: shift.shiftDate,
      hours_worked: minutesToHours(shift.hoursWorkedMinutes),
      gross_earned: shift.grossEarned,
      deductions: shift.platformDeductions,
      net_received: shift.netReceived,
      verification_status: shift.verificationStatus,
    })),
  });
};

export const getAggregateMedian = async (req: Request, res: Response): Promise<void> => {
  const workerCategory = getSingleQueryValue(req.query.worker_category)?.trim();
  const cityZone = getSingleQueryValue(req.query.city_zone)?.trim();

  if (!workerCategory || !cityZone) {
    raise(400, 'VALIDATION_ERROR', 'worker_category and city_zone are required query parameters.');
  }
  const workerCategoryValue = workerCategory as string;
  const cityZoneValue = cityZone as string;

  const filters = [
    eq(shiftLogsTable.verificationStatus, 'verified'),
    eq(shiftLogsTable.workerCategory, workerCategoryValue),
    eq(shiftLogsTable.cityZone, cityZoneValue),
    sql`${shiftLogsTable.deletedAt} IS NULL`,
  ];

  const dateFrom = parseDateIso(getSingleQueryValue(req.query.date_from), 'date_from');
  if (dateFrom) {
    filters.push(gte(shiftLogsTable.shiftDate, dateFrom));
  }

  const dateTo = parseDateIso(getSingleQueryValue(req.query.date_to), 'date_to');
  if (dateTo) {
    filters.push(lte(shiftLogsTable.shiftDate, dateTo));
  }

  const workerTotals = await db
    .select({
      worker_id: shiftLogsTable.workerId,
      total_net: sql<number>`sum(${shiftLogsTable.netReceived})::int`,
    })
    .from(shiftLogsTable)
    .where(and(...filters))
    .groupBy(shiftLogsTable.workerId);

  const cohortSize = workerTotals.length;

  if (cohortSize < 5) {
    res.status(200).json({
      worker_category: workerCategory,
      city_zone: cityZoneValue,
      cohort_size: cohortSize,
      median_net: null,
      message: 'Cohort too small to return anonymised median.',
    });
    return;
  }

  const sorted = workerTotals
    .map((row) => row.total_net)
    .sort((a, b) => a - b);

  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
    : sorted[middle]!;

  res.status(200).json({
    worker_category: workerCategoryValue,
    city_zone: cityZoneValue,
    cohort_size: cohortSize,
    median_net: median,
    date_from: dateFrom ?? null,
    date_to: dateTo ?? null,
  });
};
