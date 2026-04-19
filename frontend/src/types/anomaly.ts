export interface AnomalyShiftRecord {
  shift_id: string
  date: string
  platform: string
  hours_worked: number
  gross_earned: number
  platform_deductions: number
  net_received: number
}

export interface EarningsHistoryPayload {
  worker_id?: string
  shifts: AnomalyShiftRecord[]
}

export interface DetectAnomalyItem {
  shift_id: string
  date: string
  platform: string
  anomaly_type: string
  severity: 'low' | 'medium' | 'high'
  metric_value: number
  expected_value: number
  explanation: string
}

export interface DetectResponse {
  worker_id: string | null
  total_shifts_analyzed: number
  anomalies_found: number
  anomalies: DetectAnomalyItem[]
  summary: string
}

export interface ShiftSummary {
  total_shifts: number
  total_gross_pkr: number
  total_net_pkr: number
  avg_monthly_net_pkr: number
  platforms_worked: string[]
  date_from: string
  date_to: string
}

export interface ChatAnomalyFlag {
  date: string
  platform: string
  anomaly_type: string
  severity: string
  explanation: string
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  question: string
  earnings_context: ShiftSummary
  anomalies_context: ChatAnomalyFlag[]
  conversation_history?: ChatHistoryMessage[]
}

export interface ChatResponse {
  answer: string
  language: 'en' | 'ur'
  model_used: string
  fallback_used?: boolean
  fallback_reason?: string | null
}
