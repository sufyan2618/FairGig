import { authenticatedRequest } from './authenticatedRequest'
import type {
  AdvocateCommissionTrendsResponse,
  AdvocateIncomeDistributionResponse,
  AdvocateOverviewKpis,
  AdvocatePlatformsResponse,
  AdvocatePlatformSummaryResponse,
  AdvocateVulnerabilityFlagsResponse,
} from '../types/advocate'

const ANALYTICS_PREFIX = '/api/analytics'

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

export interface CommissionTrendsParams {
  period?: 'weekly' | 'monthly'
  platform?: string
  date_from?: string
  date_to?: string
}

export interface IncomeDistributionParams {
  month?: string
  category?: string
}

export interface VulnerabilityFlagsParams {
  month?: string
  min_drop_percent?: number
  category?: string
  city_zone?: string
  page?: number
  limit?: number
}

export interface PlatformSummaryParams {
  date_from?: string
  date_to?: string
}

export const advocateAnalyticsApi = {
  getOverviewKpis: async (): Promise<AdvocateOverviewKpis> => {
    const response = await authenticatedRequest<AdvocateOverviewKpis>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/advocate/overview-kpis`,
      },
      'Unable to load advocate KPIs right now.',
    )

    return response.data
  },

  getCommissionTrends: async (
    params: CommissionTrendsParams = {},
  ): Promise<AdvocateCommissionTrendsResponse> => {
    const response = await authenticatedRequest<AdvocateCommissionTrendsResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/advocate/commission-trends`,
        params: removeEmptyParams({
          period: params.period,
          platform: params.platform,
          date_from: params.date_from,
          date_to: params.date_to,
        }),
      },
      'Unable to load commission trends right now.',
    )

    return response.data
  },

  getIncomeDistribution: async (
    params: IncomeDistributionParams = {},
  ): Promise<AdvocateIncomeDistributionResponse> => {
    const response = await authenticatedRequest<AdvocateIncomeDistributionResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/advocate/income-distribution`,
        params: removeEmptyParams({
          month: params.month,
          category: params.category,
        }),
      },
      'Unable to load income distribution right now.',
    )

    return response.data
  },

  getVulnerabilityFlags: async (
    params: VulnerabilityFlagsParams = {},
  ): Promise<AdvocateVulnerabilityFlagsResponse> => {
    const response = await authenticatedRequest<AdvocateVulnerabilityFlagsResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/advocate/vulnerability-flags`,
        params: removeEmptyParams({
          month: params.month,
          min_drop_percent: params.min_drop_percent,
          category: params.category,
          city_zone: params.city_zone,
          page: params.page,
          limit: params.limit,
        }),
      },
      'Unable to load vulnerability flags right now.',
    )

    return response.data
  },

  getPlatformSummary: async (
    params: PlatformSummaryParams = {},
  ): Promise<AdvocatePlatformSummaryResponse> => {
    const response = await authenticatedRequest<AdvocatePlatformSummaryResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/advocate/platform-summary`,
        params: removeEmptyParams({
          date_from: params.date_from,
          date_to: params.date_to,
        }),
      },
      'Unable to load platform summary right now.',
    )

    return response.data
  },

  getPlatforms: async (): Promise<AdvocatePlatformsResponse> => {
    const response = await authenticatedRequest<AdvocatePlatformsResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/platforms`,
      },
      'Unable to load platforms right now.',
    )

    return response.data
  },
}
