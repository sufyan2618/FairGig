import type {
  ActiveAssignment,
  DashboardStat,
  SelectOption,
  SidebarItem,
  ShiftLog,
} from "../types/dashboard";

export const sidebarItems: SidebarItem[] = [
  { id: "log-shift", label: "Log Shift", icon: "clock" },
  { id: "my-earnings", label: "My Earnings", icon: "wallet" },
  {
    id: "upload-screenshots",
    label: "Upload Screen Shots",
    icon: "upload",
  },
  { id: "my-analytics", label: "My Analytics", icon: "chart" },
  {
    id: "income-certificate",
    label: "Income Certificate",
    icon: "certificate",
  },
  { id: "greivance-board", label: "Greivance Board", icon: "message" },
  { id: "profile-settings", label: "My Profile / Settings", icon: "settings" },
];

export const dashboardStats: DashboardStat[] = [
  {
    id: "active-shifts",
    label: "Active Shifts",
    value: "24",
    icon: "briefcase",
    iconTint: "bg-blue-100 text-blue-600",
  },
  {
    id: "total-earnings",
    label: "This Week Earnings",
    value: "$1,240",
    icon: "wallet",
    iconTint: "bg-orange-100 text-orange-600",
  },
  {
    id: "team-members",
    label: "Team Members",
    value: "48",
    icon: "team",
    iconTint: "bg-green-100 text-green-600",
  },
  {
    id: "equipment",
    label: "Equipment",
    value: "156",
    icon: "tool",
    iconTint: "bg-purple-100 text-purple-600",
  },
];

export const activeAssignments: ActiveAssignment[] = [
  {
    id: "downtown-infrastructure",
    title: "Downtown Infrastructure",
    completion: 75,
    budget: "$2.4M",
    timeline: "8 months",
    status: "Active",
  },
  {
    id: "residential-complex",
    title: "Residential Complex",
    completion: 45,
    budget: "$1.8M",
    timeline: "12 months",
    status: "Planning",
  },
  {
    id: "bridge-renovation",
    title: "Bridge Renovation",
    completion: 60,
    budget: "$3.2M",
    timeline: "18 months",
    status: "In Progress",
  },
];

export const shiftLogs: ShiftLog[] = [
  {
    id: "sj-001",
    memberInitials: "SJ",
    memberName: "Sarah Johnson",
    assignment: "Downtown Infrastructure",
    date: "Sep 23, 2025",
    hours: 8.5,
    status: "Approved",
    isActionEnabled: false,
  },
  {
    id: "mc-001",
    memberInitials: "MC",
    memberName: "Michael Chen",
    assignment: "Residential Complex",
    date: "Sep 23, 2025",
    hours: 7,
    status: "Pending",
    isActionEnabled: false,
  },
  {
    id: "dw-001",
    memberInitials: "DW",
    memberName: "David Wilson",
    assignment: "Bridge Renovation",
    date: "Sep 23, 2025",
    hours: 9,
    status: "Approved",
    isActionEnabled: true,
  },
];

export const projectFilterOptions: SelectOption[] = [
  { label: "All Projects", value: "all" },
  { label: "Downtown Infrastructure", value: "downtown-infrastructure" },
  { label: "Residential Complex", value: "residential-complex" },
  { label: "Bridge Renovation", value: "bridge-renovation" },
];

export const statusFilterOptions: SelectOption[] = [
  { label: "All Status", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
];
