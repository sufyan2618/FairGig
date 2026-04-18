import { useMemo } from "react";
import type { VerifiedHistoryRecord } from "../../types/verifier";

const verifiedHistorySeed: VerifiedHistoryRecord[] = [
	{
		id: "vh-001",
		submissionId: "vq-041",
		workerDisplayId: "worker_2382",
		platform: "Careem",
		shiftDate: "2026-04-10",
		reviewedAt: "2026-04-12T09:22:00Z",
		outcome: "Verified",
		reviewedBy: "verifier_07",
	},
	{
		id: "vh-002",
		submissionId: "vq-042",
		workerDisplayId: "worker_1117",
		platform: "foodpanda",
		shiftDate: "2026-04-10",
		reviewedAt: "2026-04-12T09:40:00Z",
		outcome: "Flagged",
		reviewedBy: "verifier_07",
	},
	{
		id: "vh-003",
		submissionId: "vq-043",
		workerDisplayId: "worker_7060",
		platform: "Bykea",
		shiftDate: "2026-04-11",
		reviewedAt: "2026-04-12T10:02:00Z",
		outcome: "Verified",
		reviewedBy: "verifier_07",
	},
	{
		id: "vh-004",
		submissionId: "vq-044",
		workerDisplayId: "worker_4029",
		platform: "InDrive",
		shiftDate: "2026-04-11",
		reviewedAt: "2026-04-12T10:28:00Z",
		outcome: "Verified",
		reviewedBy: "verifier_07",
	},
	{
		id: "vh-005",
		submissionId: "vq-045",
		workerDisplayId: "worker_5194",
		platform: "Yango",
		shiftDate: "2026-04-11",
		reviewedAt: "2026-04-12T10:53:00Z",
		outcome: "Flagged",
		reviewedBy: "verifier_07",
	},
	{
		id: "vh-006",
		submissionId: "vq-046",
		workerDisplayId: "worker_8842",
		platform: "Careem",
		shiftDate: "2026-04-12",
		reviewedAt: "2026-04-12T11:21:00Z",
		outcome: "Verified",
		reviewedBy: "verifier_07",
	},
];

interface UseVerifiedHistoryApiResult {
	data: VerifiedHistoryRecord[];
	isLoading: boolean;
	error: string | null;
}

export const useVerifiedHistoryApi = (): UseVerifiedHistoryApiResult => {
	const data = useMemo(
		() =>
			[...verifiedHistorySeed].sort(
				(first, second) =>
					new Date(second.reviewedAt).getTime() - new Date(first.reviewedAt).getTime(),
			),
		[],
	);

	return {
		data,
		isLoading: false,
		error: null,
	};
};
