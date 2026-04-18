import { create } from 'zustand'
import {
  advocateAnalyticsApi,
  type CommissionTrendsParams,
  type IncomeDistributionParams,
  type PlatformSummaryParams,
  type VulnerabilityFlagsParams,
} from '../api/advocateAnalyticsApi'
import type {
  AdvocateCommissionTrendsResponse,
  AdvocateIncomeDistributionResponse,
  AdvocateOverviewKpis,
  AdvocatePlatformSummaryResponse,
  AdvocateVulnerabilityFlagsResponse,
} from '../types/advocate'

interface AdvocateAnalyticsState {
  overviewKpis: AdvocateOverviewKpis | null
  commissionTrends: AdvocateCommissionTrendsResponse | null
  incomeDistribution: AdvocateIncomeDistributionResponse | null
  vulnerabilityFlags: AdvocateVulnerabilityFlagsResponse | null
  platformSummary: AdvocatePlatformSummaryResponse | null
  platforms: string[]
  isOverviewLoading: boolean
  isCommissionLoading: boolean
  isIncomeLoading: boolean
  isVulnerabilityLoading: boolean
  isPlatformSummaryLoading: boolean
  isPlatformsLoading: boolean
  error: string | null
  fetchOverviewKpis: () => Promise<void>
  fetchCommissionTrends: (params?: CommissionTrendsParams) => Promise<void>
  fetchIncomeDistribution: (params?: IncomeDistributionParams) => Promise<void>
  fetchVulnerabilityFlags: (params?: VulnerabilityFlagsParams) => Promise<void>
  fetchPlatformSummary: (params?: PlatformSummaryParams) => Promise<void>
  fetchPlatforms: () => Promise<void>
  clearError: () => void
}

export const useAdvocateAnalyticsStore = create<AdvocateAnalyticsState>((set) => ({
  overviewKpis: null,
  commissionTrends: null,
  incomeDistribution: null,
  vulnerabilityFlags: null,
  platformSummary: null,
  platforms: [],
  isOverviewLoading: false,
  isCommissionLoading: false,
  isIncomeLoading: false,
  isVulnerabilityLoading: false,
  isPlatformSummaryLoading: false,
  isPlatformsLoading: false,
  error: null,

  fetchOverviewKpis: async () => {
    set({ isOverviewLoading: true, error: null })

    try {
      const response = await advocateAnalyticsApi.getOverviewKpis()
      set({ overviewKpis: response, isOverviewLoading: false })
    } catch (error) {
      set({
        isOverviewLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load advocate KPIs.',
      })
      throw error
    }
  },

  fetchCommissionTrends: async (params = {}) => {
    set({ isCommissionLoading: true, error: null })

    try {
      const response = await advocateAnalyticsApi.getCommissionTrends(params)
      set({ commissionTrends: response, isCommissionLoading: false })
    } catch (error) {
      set({
        isCommissionLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load commission trends.',
      })
      throw error
    }
  },

  fetchIncomeDistribution: async (params = {}) => {
    set({ isIncomeLoading: true, error: null })

    try {
      const response = await advocateAnalyticsApi.getIncomeDistribution(params)
      set({ incomeDistribution: response, isIncomeLoading: false })
    } catch (error) {
      set({
        isIncomeLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load income distribution.',
      })
      throw error
    }
  },

  fetchVulnerabilityFlags: async (params = {}) => {
    set({ isVulnerabilityLoading: true, error: null })

    try {
      const response = await advocateAnalyticsApi.getVulnerabilityFlags(params)
      set({ vulnerabilityFlags: response, isVulnerabilityLoading: false })
    } catch (error) {
      set({
        isVulnerabilityLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load vulnerability flags.',
      })
      throw error
    }
  },

  fetchPlatformSummary: async (params = {}) => {
    set({ isPlatformSummaryLoading: true, error: null })

    try {
      const response = await advocateAnalyticsApi.getPlatformSummary(params)
      set({ platformSummary: response, isPlatformSummaryLoading: false })
    } catch (error) {
      set({
        isPlatformSummaryLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load platform summary.',
      })
      throw error
    }
  },

  fetchPlatforms: async () => {
    set({ isPlatformsLoading: true, error: null })

    try {
      const response = await advocateAnalyticsApi.getPlatforms()
      set({ platforms: response.platforms, isPlatformsLoading: false })
    } catch (error) {
      set({
        isPlatformsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load platforms.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
