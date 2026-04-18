import { create } from 'zustand'
import { verifierEarningsApi } from '../api/verifierEarningsApi'
import type {
  VerificationDecisionPayload,
  VerificationHistoryFilters,
  VerificationHistoryRecord,
  VerificationQueueSubmission,
  VerificationReviewSubmission,
  VerifierDashboardStats,
} from '../types/verifier'
import type { PaginationMeta } from '../types/worker'

interface FetchQueueParams {
  page?: number
  limit?: number
}

interface VerifierVerificationState {
  queue: VerificationQueueSubmission[]
  queuePagination: PaginationMeta
  history: VerificationHistoryRecord[]
  historyPagination: PaginationMeta
  dashboardStats: VerifierDashboardStats
  selectedSubmission: VerificationReviewSubmission | null
  isQueueLoading: boolean
  isHistoryLoading: boolean
  isSubmissionLoading: boolean
  isDecisionSubmitting: boolean
  isDashboardLoading: boolean
  error: string | null
  notice: string | null
  lastHistoryFilters: VerificationHistoryFilters
  fetchQueue: (params?: FetchQueueParams) => Promise<void>
  fetchHistory: (filters?: VerificationHistoryFilters) => Promise<void>
  fetchSubmission: (submissionId: string) => Promise<void>
  submitDecision: (submissionId: string, payload: VerificationDecisionPayload) => Promise<void>
  fetchDashboardStats: () => Promise<void>
  clearError: () => void
  clearNotice: () => void
}

const defaultPagination: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
}

const getIsoDateUtc = (value = new Date()): string => value.toISOString().slice(0, 10)

const bySubmittedAtAsc = (items: VerificationQueueSubmission[]): VerificationQueueSubmission[] =>
  [...items].sort(
    (first, second) =>
      new Date(first.submittedAt).getTime() - new Date(second.submittedAt).getTime(),
  )

export const useVerifierVerificationStore = create<VerifierVerificationState>((set, get) => ({
  queue: [],
  queuePagination: defaultPagination,
  history: [],
  historyPagination: defaultPagination,
  dashboardStats: {
    pendingQueueCount: 0,
    verifiedTodayCount: 0,
    flaggedTodayCount: 0,
    lastSyncedAt: '',
  },
  selectedSubmission: null,
  isQueueLoading: false,
  isHistoryLoading: false,
  isSubmissionLoading: false,
  isDecisionSubmitting: false,
  isDashboardLoading: false,
  error: null,
  notice: null,
  lastHistoryFilters: {
    page: 1,
    limit: 100,
  },

  fetchQueue: async (params = {}) => {
    set({ isQueueLoading: true, error: null })

    try {
      const response = await verifierEarningsApi.listQueue(params.page ?? 1, params.limit ?? 100)
      set({
        queue: bySubmittedAtAsc(response.data),
        queuePagination: response.pagination,
        isQueueLoading: false,
      })
    } catch (error) {
      set({
        isQueueLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load verification queue.',
      })
      throw error
    }
  },

  fetchHistory: async (filters = {}) => {
    set({ isHistoryLoading: true, error: null })

    try {
      const finalFilters: VerificationHistoryFilters = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 100,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }

      const response = await verifierEarningsApi.getHistory(finalFilters)

      set({
        history: response.data,
        historyPagination: response.pagination,
        lastHistoryFilters: finalFilters,
        isHistoryLoading: false,
      })
    } catch (error) {
      set({
        isHistoryLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load verification history.',
      })
      throw error
    }
  },

  fetchSubmission: async (submissionId) => {
    set({ isSubmissionLoading: true, error: null, notice: null })

    try {
      const response = await verifierEarningsApi.getSubmissionById(submissionId)
      set({ selectedSubmission: response, isSubmissionLoading: false })
    } catch (error) {
      set({
        selectedSubmission: null,
        isSubmissionLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load submission details.',
      })
      throw error
    }
  },

  submitDecision: async (submissionId, payload) => {
    set({ isDecisionSubmitting: true, error: null, notice: null })

    try {
      const result = await verifierEarningsApi.submitDecision(submissionId, payload)

      set((state) => {
        const updatedQueue = state.queue.filter((item) => item.id !== submissionId)
        const nextQueueTotal = Math.max(state.queuePagination.total - 1, 0)

        return {
          queue: updatedQueue,
          queuePagination: {
            ...state.queuePagination,
            total: nextQueueTotal,
            total_pages: Math.ceil(nextQueueTotal / Math.max(state.queuePagination.limit, 1)),
          },
          selectedSubmission: null,
          isDecisionSubmitting: false,
          notice: result.message,
        }
      })

      try {
        await get().fetchDashboardStats()
      } catch {
        // Dashboard refresh failure should not block decision completion UX.
      }
    } catch (error) {
      set({
        isDecisionSubmitting: false,
        error: error instanceof Error ? error.message : 'Unable to submit decision.',
      })
      throw error
    }
  },

  fetchDashboardStats: async () => {
    set({ isDashboardLoading: true, error: null })

    const today = getIsoDateUtc()

    try {
      const [queueResponse, verifiedTodayResponse, flaggedTodayResponse, unverifiableTodayResponse] =
        await Promise.all([
          verifierEarningsApi.listQueue(1, 1),
          verifierEarningsApi.getHistory({ page: 1, limit: 1, status: 'verified', dateFrom: today, dateTo: today }),
          verifierEarningsApi.getHistory({ page: 1, limit: 1, status: 'flagged', dateFrom: today, dateTo: today }),
          verifierEarningsApi.getHistory({ page: 1, limit: 1, status: 'unverifiable', dateFrom: today, dateTo: today }),
        ])

      set({
        dashboardStats: {
          pendingQueueCount: queueResponse.pagination.total,
          verifiedTodayCount: verifiedTodayResponse.pagination.total,
          flaggedTodayCount:
            flaggedTodayResponse.pagination.total + unverifiableTodayResponse.pagination.total,
          lastSyncedAt: new Date().toISOString(),
        },
        isDashboardLoading: false,
      })
    } catch (error) {
      set({
        isDashboardLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load dashboard stats.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),
}))
