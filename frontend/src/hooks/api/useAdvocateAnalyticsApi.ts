import { useShallow } from 'zustand/react/shallow'
import { useAdvocateAnalyticsStore } from '../../store/advocateAnalyticsStore'

export const useAdvocateAnalyticsApi = () =>
  useAdvocateAnalyticsStore(
    useShallow((state) => ({
      overviewKpis: state.overviewKpis,
      commissionTrends: state.commissionTrends,
      incomeDistribution: state.incomeDistribution,
      vulnerabilityFlags: state.vulnerabilityFlags,
      platformSummary: state.platformSummary,
      platforms: state.platforms,
      isOverviewLoading: state.isOverviewLoading,
      isCommissionLoading: state.isCommissionLoading,
      isIncomeLoading: state.isIncomeLoading,
      isVulnerabilityLoading: state.isVulnerabilityLoading,
      isPlatformSummaryLoading: state.isPlatformSummaryLoading,
      isPlatformsLoading: state.isPlatformsLoading,
      error: state.error,
      fetchOverviewKpis: state.fetchOverviewKpis,
      fetchCommissionTrends: state.fetchCommissionTrends,
      fetchIncomeDistribution: state.fetchIncomeDistribution,
      fetchVulnerabilityFlags: state.fetchVulnerabilityFlags,
      fetchPlatformSummary: state.fetchPlatformSummary,
      fetchPlatforms: state.fetchPlatforms,
      clearError: state.clearError,
    })),
  )
