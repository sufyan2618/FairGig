import { useShallow } from 'zustand/react/shallow'
import { useVerifierVerificationStore } from '../../store/verifierVerificationStore'

export const useVerifierVerificationApi = () =>
  useVerifierVerificationStore(
    useShallow((state) => ({
      queue: state.queue,
      queuePagination: state.queuePagination,
      history: state.history,
      historyPagination: state.historyPagination,
      dashboardStats: state.dashboardStats,
      selectedSubmission: state.selectedSubmission,
      isQueueLoading: state.isQueueLoading,
      isHistoryLoading: state.isHistoryLoading,
      isSubmissionLoading: state.isSubmissionLoading,
      isDecisionSubmitting: state.isDecisionSubmitting,
      isDashboardLoading: state.isDashboardLoading,
      error: state.error,
      notice: state.notice,
      fetchQueue: state.fetchQueue,
      fetchHistory: state.fetchHistory,
      fetchSubmission: state.fetchSubmission,
      submitDecision: state.submitDecision,
      fetchDashboardStats: state.fetchDashboardStats,
      clearError: state.clearError,
      clearNotice: state.clearNotice,
    })),
  )
