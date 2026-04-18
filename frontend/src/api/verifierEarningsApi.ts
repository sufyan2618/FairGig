import { authenticatedRequest } from './authenticatedRequest'
import type {
  VerificationDecisionPayload,
  VerificationDecisionResult,
  VerificationHistoryFilters,
  VerificationHistoryRecord,
  VerificationQueueSubmission,
  VerificationReviewSubmission,
  VerifierPaginatedHistory,
  VerifierPaginatedQueue,
} from '../types/verifier'
import type { PaginationMeta } from '../types/worker'

const EARNINGS_PREFIX = '/api/earnings'

interface VerificationQueueItemApi {
  id: string
  worker_id: string
  worker_display_name: string
  platform: string
  date: string
  submitted_at: string
  verification_status: 'pending_review'
}

interface VerificationQueueResponseApi {
  data: VerificationQueueItemApi[]
  pagination: PaginationMeta
}

interface VerificationByIdApi {
  data: {
    id: string
    worker_id: string
    worker_display_name: string
    platform: string
    date: string
    hours_worked: number
    gross_earned: number
    deductions: number
    net_received: number
    screenshot_url: string | null
    verification_status: 'pending_review'
    submitted_at: string
  }
}

interface VerificationDecisionResponseApi {
  data: {
    id: string
    verification_status: 'verified' | 'flagged' | 'unverifiable'
    verification_note: string | null
    verified_by: string | null
    verified_at: string | null
  }
  message: string
}

interface VerificationHistoryItemApi {
  decision_id: string
  shift_id: string
  decision_status: 'verified' | 'flagged' | 'unverifiable'
  note: string | null
  decided_at: string
  platform: string | null
  shift_date: string | null
  worker_display_name: string | null
}

interface VerificationHistoryResponseApi {
  data: VerificationHistoryItemApi[]
  pagination: PaginationMeta
}

const removeEmptyParams = (
  params: Record<string, string | number | undefined>,
): Record<string, string | number> => {
  const cleaned: Record<string, string | number> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    cleaned[key] = value
  }

  return cleaned
}

const mapQueueItem = (item: VerificationQueueItemApi): VerificationQueueSubmission => ({
  id: item.id,
  workerId: item.worker_id,
  workerDisplayName: item.worker_display_name,
  platform: item.platform,
  shiftDate: item.date,
  submittedAt: item.submitted_at,
  verificationStatus: item.verification_status,
})

const mapReviewSubmission = (
  payload: VerificationByIdApi['data'],
): VerificationReviewSubmission => ({
  id: payload.id,
  workerId: payload.worker_id,
  workerDisplayName: payload.worker_display_name,
  platform: payload.platform,
  shiftDate: payload.date,
  hoursWorked: payload.hours_worked,
  grossEarned: payload.gross_earned,
  deductions: payload.deductions,
  netReceived: payload.net_received,
  screenshotUrl: payload.screenshot_url,
  verificationStatus: payload.verification_status,
  submittedAt: payload.submitted_at,
})

const mapHistoryItem = (item: VerificationHistoryItemApi): VerificationHistoryRecord => ({
  decisionId: item.decision_id,
  submissionId: item.shift_id,
  outcome: item.decision_status,
  note: item.note,
  reviewedAt: item.decided_at,
  platform: item.platform,
  shiftDate: item.shift_date,
  workerDisplayName: item.worker_display_name,
})

export const verifierEarningsApi = {
  listQueue: async (page = 1, limit = 100): Promise<VerifierPaginatedQueue> => {
    const response = await authenticatedRequest<VerificationQueueResponseApi>(
      {
        method: 'GET',
        url: `${EARNINGS_PREFIX}/verifications/queue`,
        params: { page, limit },
      },
      'Unable to load verification queue right now.',
    )

    return {
      data: response.data.data.map(mapQueueItem),
      pagination: response.data.pagination,
    }
  },

  getSubmissionById: async (submissionId: string): Promise<VerificationReviewSubmission> => {
    const response = await authenticatedRequest<VerificationByIdApi>(
      {
        method: 'GET',
        url: `${EARNINGS_PREFIX}/verifications/${submissionId}`,
      },
      'Unable to load verification submission right now.',
    )

    return mapReviewSubmission(response.data.data)
  },

  submitDecision: async (
    submissionId: string,
    payload: VerificationDecisionPayload,
  ): Promise<VerificationDecisionResult> => {
    const response = await authenticatedRequest<VerificationDecisionResponseApi>(
      {
        method: 'POST',
        url: `${EARNINGS_PREFIX}/verifications/${submissionId}/decision`,
        data: payload,
      },
      'Unable to submit verification decision right now.',
    )

    return {
      id: response.data.data.id,
      verificationStatus: response.data.data.verification_status,
      verificationNote: response.data.data.verification_note,
      verifiedBy: response.data.data.verified_by,
      verifiedAt: response.data.data.verified_at,
      message: response.data.message,
    }
  },

  getHistory: async (filters: VerificationHistoryFilters = {}): Promise<VerifierPaginatedHistory> => {
    const response = await authenticatedRequest<VerificationHistoryResponseApi>(
      {
        method: 'GET',
        url: `${EARNINGS_PREFIX}/verifications/history`,
        params: removeEmptyParams({
          page: filters.page,
          limit: filters.limit,
          status: filters.status,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        }),
      },
      'Unable to load verification history right now.',
    )

    return {
      data: response.data.data.map(mapHistoryItem),
      pagination: response.data.pagination,
    }
  },
}
