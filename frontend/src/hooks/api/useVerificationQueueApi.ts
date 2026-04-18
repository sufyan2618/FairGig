import { useMemo } from "react";
import type { VerificationQueueSubmission } from "../../types/verifier";

const queueSubmissions: VerificationQueueSubmission[] = [
  {
    id: "vq-001",
    workerDisplayId: "worker_2391",
    platform: "Careem",
    shiftDate: "2026-04-16",
    submittedAt: "2026-04-16T08:10:00Z",
    status: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vq-002",
    workerDisplayId: "worker_9402",
    platform: "foodpanda",
    shiftDate: "2026-04-16",
    submittedAt: "2026-04-16T08:34:00Z",
    status: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1616469829526-e7f26db9b7fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vq-003",
    workerDisplayId: "worker_1128",
    platform: "Bykea",
    shiftDate: "2026-04-16",
    submittedAt: "2026-04-16T09:12:00Z",
    status: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vq-004",
    workerDisplayId: "worker_7810",
    platform: "InDrive",
    shiftDate: "2026-04-15",
    submittedAt: "2026-04-16T09:44:00Z",
    status: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vq-005",
    workerDisplayId: "worker_6407",
    platform: "Careem",
    shiftDate: "2026-04-15",
    submittedAt: "2026-04-16T10:03:00Z",
    status: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vq-006",
    workerDisplayId: "worker_5036",
    platform: "Yango",
    shiftDate: "2026-04-15",
    submittedAt: "2026-04-16T10:27:00Z",
    status: "Pending",
    screenshotUrl:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
  },
];

const sortFirstComeFirstServed = (
  submissions: VerificationQueueSubmission[],
): VerificationQueueSubmission[] =>
  [...submissions].sort(
    (first, second) =>
      new Date(first.submittedAt).getTime() - new Date(second.submittedAt).getTime(),
  );

interface UseVerificationQueueApiResult {
  data: VerificationQueueSubmission[];
  isLoading: boolean;
  error: string | null;
}

interface UseVerificationSubmissionApiResult {
  data: VerificationQueueSubmission | null;
  isLoading: boolean;
  error: string | null;
}

export const useVerificationQueueApi = (): UseVerificationQueueApiResult => {
  const data = useMemo(() => sortFirstComeFirstServed(queueSubmissions), []);

  return {
    data,
    isLoading: false,
    error: null,
  };
};

export const useVerificationSubmissionApi = (
  submissionId?: string,
): UseVerificationSubmissionApiResult => {
  const data = useMemo(() => {
    if (!submissionId) {
      return null;
    }

    return queueSubmissions.find((submission) => submission.id === submissionId) ?? null;
  }, [submissionId]);

  return {
    data,
    isLoading: false,
    error: null,
  };
};
