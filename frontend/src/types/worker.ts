export type ShiftVerificationStatus =
  | 'pending'
  | 'pending_review'
  | 'verified'
  | 'flagged'
  | 'unverifiable'

export interface WorkerShift {
  id: string
  worker_id: string
  platform: string
  date: string
  hours_worked: number
  gross_earned: number
  deductions: number
  net_received: number
  worker_category: string | null
  city_zone: string | null
  verification_status: ShiftVerificationStatus
  verification_note: string | null
  screenshot_url: string | null
  submitted_at: string
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface WorkerShiftsResponse {
  data: WorkerShift[]
  pagination: PaginationMeta
}

export interface WorkerShiftResponse {
  data: WorkerShift
}

export interface CreateShiftPayload {
  platform: string
  date: string
  hours_worked: number
  gross_earned: number
  deductions: number
  net_received: number
  worker_category?: string | null
  city_zone?: string | null
}

export type UpdateShiftPayload = CreateShiftPayload

export interface CsvImportFailure {
  row: number
  message: string
}

export interface CsvImportSummaryResponse {
  summary: {
    total_rows: number
    imported: number
    failed: number
    failures: CsvImportFailure[]
  }
}

export interface ShiftScreenshotResponse {
  shift_id: string
  verification_status: ShiftVerificationStatus
  screenshot_url: string
}

export type GrievanceStatus = 'open' | 'escalated' | 'resolved'

export interface GrievanceComplaint {
  id: string
  posted_by: string
  platform: string
  category: string
  description: string
  tags: string[]
  cluster_id: string | null
  cluster_label: string | null
  escalation_status: GrievanceStatus
  moderation_note: string | null
  can_delete?: boolean
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface GrievanceListResponse {
  data: GrievanceComplaint[]
  pagination: PaginationMeta
}

export interface GrievanceItemResponse {
  data: GrievanceComplaint
}

export interface CreateGrievancePayload {
  platform: string
  category: string
  description: string
}

export interface WorkerMedianResponse {
  category: string
  city_zone: string
  month: string
  median_net_earned_pkr: number | null
  cohort_size: number
  suppressed: boolean
  message: string | null
}

export interface WorkerPlatformsResponse {
  platforms: string[]
}

export interface WorkerProfileUpdatePayload {
  full_name: string
}

export interface WorkerChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface WorkerNotificationPrefs {
  appNotifications: boolean
  smsAlerts: boolean
  payoutUpdates: boolean
  grievanceUpdates: boolean
}

export interface WorkerProfilePrefs {
  city: string
  primaryCategory: string
  notifications: WorkerNotificationPrefs
}
