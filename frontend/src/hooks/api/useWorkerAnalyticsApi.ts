import { useShallow } from 'zustand/react/shallow'
import { useWorkerAnalyticsStore } from '../../store/workerAnalyticsStore'

export const useWorkerAnalyticsApi = () =>
  useWorkerAnalyticsStore(
    useShallow((state) => ({
      platforms: state.platforms,
      workerMedian: state.workerMedian,
      isPlatformsLoading: state.isPlatformsLoading,
      isMedianLoading: state.isMedianLoading,
      error: state.error,
      fetchPlatforms: state.fetchPlatforms,
      fetchWorkerMedian: state.fetchWorkerMedian,
      clearError: state.clearError,
    })),
  )
