import type { PaginationMeta } from './worker'

export interface AdvocateOverviewKpis {
  total_active_workers: number
  total_verified_earnings_this_month_pkr: number
  total_grievances_this_week: number
  total_vulnerability_flags_this_month: number
  most_complained_platform: string | null
}

export interface AdvocateCommissionTrendPeriod {
  label: string
  avg_commission_rate: number
  sample_count: number
}

export interface AdvocateCommissionTrendPlatform {
  platform: string
  periods: AdvocateCommissionTrendPeriod[]
}

export interface AdvocateCommissionTrendsResponse {
  period: 'weekly' | 'monthly'
  data: AdvocateCommissionTrendPlatform[]
}

export interface AdvocateIncomeDistributionZone {
  city_zone: string
  cohort_size: number
  suppressed: boolean
  median_net_pkr: number | null
  p25_net_pkr: number | null
  p75_net_pkr: number | null
  message: string | null
}

export interface AdvocateIncomeDistributionResponse {
  month: string
  zones: AdvocateIncomeDistributionZone[]
}

export interface AdvocateVulnerabilityWorker {
  worker_ref: string
  category: string
  city_zone: string
  platform: string
  prev_month_net_pkr: number
  current_month_net_pkr: number
  drop_percent: number
  severity: string
}

export interface AdvocateVulnerabilityFlagsResponse {
  month: string
  threshold_percent: number
  total_flagged: number
  workers: AdvocateVulnerabilityWorker[]
}

export interface AdvocatePlatformSummaryItem {
  platform: string
  total_workers: number
  avg_net_earned_pkr: number
  avg_commission_rate: number
  total_shifts: number
}

export interface AdvocatePlatformSummaryResponse {
  platforms: AdvocatePlatformSummaryItem[]
}

export interface AdvocatePlatformsResponse {
  platforms: string[]
}

export type AdvocateEscalationStatus = 'open' | 'escalated' | 'resolved'

export interface AdvocateComplaint {
  id: string
  posted_by: string
  platform: string
  category: string
  description: string
  tags: string[]
  cluster_id: string | null
  cluster_label: string | null
  escalation_status: AdvocateEscalationStatus
  moderation_note: string | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface AdvocateComplaintListResponse {
  data: AdvocateComplaint[]
  pagination: PaginationMeta
}

export interface AdvocateComplaintItemResponse {
  data: AdvocateComplaint
}

export interface AdvocateComplaintFilters {
  page?: number
  limit?: number
  platform?: string
  category?: string
  escalation_status?: AdvocateEscalationStatus
  cluster_id?: string
  tag?: string
}

export interface AdvocateTagsUpdatePayload {
  tags: string[]
}

export interface AdvocateStatusUpdatePayload {
  escalation_status: AdvocateEscalationStatus
  moderation_note?: string
}

export interface AdvocateClusterUpdatePayload {
  cluster_id: string
  cluster_label: string
}

export interface AdvocateClusterSummary {
  cluster_id: string
  cluster_label: string
  complaint_count: number
  platforms: string[]
  top_category: string | null
  escalation_breakdown: {
    open: number
    escalated: number
    resolved: number
  }
}

export interface AdvocateSuggestedCluster {
  suggested_label: string
  complaint_ids: string[]
  top_keywords: string[]
}

export interface AdvocateSuggestClustersResponse {
  suggested_clusters: AdvocateSuggestedCluster[]
}

export interface AdvocateTopCategory {
  category: string
  count: number
}

export interface AdvocateComplaintSeriesPoint {
  date: string
  count: number
}

export interface AdvocateComplaintsByPlatformItem {
  platform: string
  total: number
  series: AdvocateComplaintSeriesPoint[]
}

export interface AdvocateEscalationRatio {
  open: number
  escalated: number
  resolved: number
  total: number
}

export interface AdvocateProfile {
  fullName: string
  email: string
}

export interface AdvocatePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
