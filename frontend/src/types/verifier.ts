import type { IconName } from "./dashboard";

export type VerifierSidebarItemId =
	| "dashboard"
	| "verification-queue"
	| "verified-history"
	| "profile-settings";

export interface VerifierSidebarItem {
	id: VerifierSidebarItemId;
	label: string;
	icon: IconName;
}

export interface VerifierQuickStat {
	id: string;
	label: string;
	value: number;
	icon: IconName;
	iconTint: string;
	helperText: string;
}

export type VerificationQueueStatus = "Pending";

export interface VerificationQueueSubmission {
	id: string;
	workerDisplayId: string;
	platform: string;
	shiftDate: string;
	submittedAt: string;
	status: VerificationQueueStatus;
	screenshotUrl: string;
}

export type VerificationDecisionOutcome = "Verified" | "Flagged";

export interface VerifiedHistoryRecord {
	id: string;
	submissionId: string;
	workerDisplayId: string;
	platform: string;
	shiftDate: string;
	reviewedAt: string;
	outcome: VerificationDecisionOutcome;
	reviewedBy: string;
}

export interface VerifierProfile {
	fullName: string;
	email: string;
	phone: string;
	timezone: string;
}

export interface VerifierPasswordPayload {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}
