import { create } from 'zustand'
import { workerAnalyticsApi } from '../api/workerAnalyticsApi'
import type { WorkerMedianResponse } from '../types/worker'

interface WorkerAnalyticsState {
  platforms: string[]
  workerMedian: WorkerMedianResponse | null
  isPlatformsLoading: boolean
  isMedianLoading: boolean
  error: string | null
  fetchPlatforms: () => Promise<void>
  fetchWorkerMedian: (category: string, cityZone: string, month?: string) => Promise<void>
  clearError: () => void
}

export const useWorkerAnalyticsStore = create<WorkerAnalyticsState>((set) => ({
  platforms: [],
  workerMedian: null,
  isPlatformsLoading: false,
  isMedianLoading: false,
  error: null,

  fetchPlatforms: async () => {
    set({ isPlatformsLoading: true, error: null })
    try {
      const response = await workerAnalyticsApi.getPlatforms()
      set({ platforms: response.platforms, isPlatformsLoading: false })
    } catch (error) {
      set({
        isPlatformsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load platforms.',
      })
      throw error
    }
  },

  fetchWorkerMedian: async (category, cityZone, month) => {
    set({ isMedianLoading: true, error: null })
    try {
      const response = await workerAnalyticsApi.getWorkerMedian(category, cityZone, month)
      set({ workerMedian: response, isMedianLoading: false })
    } catch (error) {
      set({
        isMedianLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load worker median.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
