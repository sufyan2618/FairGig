import { useShallow } from 'zustand/react/shallow'
import { useWorkerGrievanceStore } from '../../store/workerGrievanceStore'

export const useWorkerGrievanceApi = () =>
  useWorkerGrievanceStore(
    useShallow((state) => ({
      complaints: state.complaints,
      pagination: state.pagination,
      isLoading: state.isLoading,
      isSubmitting: state.isSubmitting,
      error: state.error,
      notice: state.notice,
      fetchComplaints: state.fetchComplaints,
      createComplaint: state.createComplaint,
      deleteComplaint: state.deleteComplaint,
      clearError: state.clearError,
      clearNotice: state.clearNotice,
    })),
  )
