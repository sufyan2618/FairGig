import type { SelectOption, SidebarItem } from "../types/dashboard";

export const advocateSidebarItems: SidebarItem[] = [
  { id: "advocate-dashboard", label: "Dashboard", icon: "dashboard" },
  {
    id: "advocate-commission-tracker",
    label: "Commission Rate Tracker",
    icon: "chart",
  },
  {
    id: "advocate-income-distribution-map",
    label: "Income Distribution Map",
    icon: "wallet",
  },
  {
    id: "advocate-vulnerability-flags",
    label: "Vulnerability Flags",
    icon: "team",
  },
  {
    id: "advocate-grievance-moderation",
    label: "Grievance Board (Moderation)",
    icon: "message",
  },
  {
    id: "advocate-complaint-analytics",
    label: "Complaint Analytics",
    icon: "chart",
  },
  {
    id: "advocate-profile-settings",
    label: "My Profile / Settings",
    icon: "settings",
  },
];

export const advocatePlatformOptions: SelectOption[] = [
  { label: "All Platforms", value: "all" },
  { label: "Bykea", value: "Bykea" },
  { label: "Careem", value: "Careem" },
  { label: "foodpanda", value: "foodpanda" },
];

export const advocateCityOptions: SelectOption[] = [
  { label: "All Cities", value: "all" },
  { label: "Karachi", value: "Karachi" },
  { label: "Lahore", value: "Lahore" },
  { label: "Islamabad", value: "Islamabad" },
];
