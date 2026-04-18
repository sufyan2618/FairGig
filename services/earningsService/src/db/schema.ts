import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar, date } from 'drizzle-orm/pg-core';

export const verificationStatusEnum = pgEnum('verification_status', [
	'pending',
	'pending_review',
	'verified',
	'flagged',
	'unverifiable',
]);

export const decisionStatusEnum = pgEnum('decision_status', ['verified', 'flagged', 'unverifiable']);

export const shiftLogsTable = pgTable(
	'shift_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		workerId: uuid('worker_id').notNull(),
		platform: varchar('platform', { length: 80 }).notNull(),
		shiftDate: date('shift_date').notNull(),
		hoursWorkedMinutes: integer('hours_worked_minutes').notNull(),
		grossEarned: integer('gross_earned').notNull(),
		platformDeductions: integer('platform_deductions').notNull(),
		netReceived: integer('net_received').notNull(),
		workerCategory: varchar('worker_category', { length: 60 }),
		cityZone: varchar('city_zone', { length: 80 }),
		verificationStatus: verificationStatusEnum('verification_status').notNull().default('pending'),
		verificationNote: text('verification_note'),
		screenshotUrl: text('screenshot_url'),
		screenshotStoragePath: text('screenshot_storage_path'),
		submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		verifiedById: uuid('verified_by_id'),
		deletedAt: timestamp('deleted_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('idx_shift_logs_worker_id').on(table.workerId),
		index('idx_shift_logs_status').on(table.verificationStatus),
		index('idx_shift_logs_shift_date').on(table.shiftDate),
		index('idx_shift_logs_category_zone').on(table.workerCategory, table.cityZone),
	],
);

export const verificationDecisionsTable = pgTable(
	'verification_decisions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		shiftId: uuid('shift_id')
			.notNull()
			.references(() => shiftLogsTable.id, { onDelete: 'cascade' }),
		verifierId: uuid('verifier_id').notNull(),
		decisionStatus: decisionStatusEnum('decision_status').notNull(),
		note: text('note'),
		decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('idx_verification_decisions_shift_id').on(table.shiftId),
		index('idx_verification_decisions_verifier_id').on(table.verifierId),
		index('idx_verification_decisions_decision_status').on(table.decisionStatus),
	],
);

export type ShiftLog = typeof shiftLogsTable.$inferSelect;
export type NewShiftLog = typeof shiftLogsTable.$inferInsert;
export type VerificationDecision = typeof verificationDecisionsTable.$inferSelect;
