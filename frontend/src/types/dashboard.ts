export type IconName =
  | "dashboard"
  | "clock"
  | "wallet"
  | "upload"
  | "chart"
  | "certificate"
  | "message"
  | "user"
  | "settings"
  | "bell"
  | "search"
  | "briefcase"
  | "team"
  | "tool";

export type SidebarItemId =
  | "advocate-dashboard"
  | "advocate-commission-tracker"
  | "advocate-income-distribution-map"
  | "advocate-grievance-moderation"
  | "advocate-complaint-analytics"
  | "advocate-profile-settings"
  | "log-shift"
  | "my-earnings"
  | "upload-screenshots"
  | "my-analytics"
  | "income-certificate"
  | "greivance-board"
  | "profile-settings";

export interface SidebarItem {
  id: SidebarItemId;
  label: string;
  icon: IconName;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  icon: IconName;
  iconTint: string;
}

export type AssignmentStatus = "Active" | "Planning" | "In Progress";

export interface ActiveAssignment {
  id: string;
  title: string;
  completion: number;
  budget: string;
  timeline: string;
  status: AssignmentStatus;
}

export type ShiftStatus = "Approved" | "Pending" | "Rejected";

export interface ShiftLog {
  id: string;
  memberInitials: string;
  memberName: string;
  assignment: string;
  date: string;
  hours: number;
  status: ShiftStatus;
  isActionEnabled: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}
