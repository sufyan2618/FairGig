export type VerificationStatus = 'pending' | 'pending_review' | 'verified' | 'flagged' | 'unverifiable';
export type DecisionStatus = 'verified' | 'flagged' | 'unverifiable';

export interface ShiftBody {
  platform: string;
  date: string;
  hours_worked: number;
  gross_earned: number;
  deductions: number;
  net_received: number;
  worker_category?: string;
  city_zone?: string;
}

export interface VerificationDecisionBody {
  status: DecisionStatus;
  note?: string;
}
