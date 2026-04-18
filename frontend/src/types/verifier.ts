import type { IconName } from './dashboard'
import type { PaginationMeta } from './worker'

export type VerifierSidebarItemId =
	| 'dashboard'
	| 'verification-queue'
	| 'verified-history'
	| 'profile-settings'

export interface VerifierSidebarItem {
	id: VerifierSidebarItemId
	label: string
	icon: IconName
}

export interface VerifierQuickStat {
	id: string
	label: string
	value: number
	icon: IconName
	iconTint: string
	helperText: string
}

export type VerificationQueueStatus = 'pending_review'
export type VerificationDecisionStatus = 'verified' | 'flagged' | 'unverifiable'

export interface VerificationQueueSubmission {
	id: string
	workerId: string
	workerDisplayName: string
	platform: string
	shiftDate: string
	submittedAt: string
	verificationStatus: VerificationQueueStatus
}

export interface VerificationReviewSubmission {
	id: string
	workerId: string
	workerDisplayName: string
	platform: string
	shiftDate: string
	hoursWorked: number
	grossEarned: number
	deductions: number
	netReceived: number
	screenshotUrl: string | null
	verificationStatus: VerificationQueueStatus
	submittedAt: string
}

export interface VerificationDecisionPayload {
	status: VerificationDecisionStatus
	note?: string
}

export interface VerificationDecisionResult {
	id: string
	verificationStatus: VerificationDecisionStatus
	verificationNote: string | null
	verifiedBy: string | null
	verifiedAt: string | null
	message: string
}

export interface VerificationHistoryRecord {
	decisionId: string
	submissionId: string
	workerDisplayName: string | null
	platform: string | null
	shiftDate: string | null
	reviewedAt: string
	outcome: VerificationDecisionStatus
	note: string | null
}

export interface VerificationHistoryFilters {
	status?: VerificationDecisionStatus
	dateFrom?: string
	dateTo?: string
	page?: number
	limit?: number
}

export interface VerifierDashboardStats {
	pendingQueueCount: number
	verifiedTodayCount: number
	flaggedTodayCount: number
	lastSyncedAt: string
}

export interface VerifierPaginatedQueue {
	data: VerificationQueueSubmission[]
	pagination: PaginationMeta
}

export interface VerifierPaginatedHistory {
	data: VerificationHistoryRecord[]
	pagination: PaginationMeta
}

export interface VerifierProfile {
	fullName: string
	email: string
}

export interface VerifierProfileUpdatePayload {
	fullName: string
}

export interface VerifierPasswordPayload {
	currentPassword: string
	newPassword: string
	confirmPassword: string
}
