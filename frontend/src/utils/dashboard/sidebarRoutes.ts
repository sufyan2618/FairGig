import type { SidebarItemId } from "../../types/dashboard";

const sidebarRouteMap: Record<SidebarItemId, string> = {
  "log-shift": "/dashboard/log-shift",
  "my-earnings": "/dashboard/my-earnings",
  "upload-screenshots": "/dashboard/upload-screenshot",
  "my-analytics": "/dashboard/my-analytics",
  "income-certificate": "/dashboard/income-certificate",
  "greivance-board": "/dashboard/grievance-board",
  "profile-settings": "/dashboard/profile-settings",
};

const pathToSidebarItemMap: Record<string, SidebarItemId> = {
  "/dashboard/log-shift": "log-shift",
  "/dashboard/my-earnings": "my-earnings",
  "/dashboard/upload-screenshot": "upload-screenshots",
  "/dashboard/upload-screenshots": "upload-screenshots",
  "/dashboard/my-analytics": "my-analytics",
  "/dashboard/income-certificate": "income-certificate",
  "/dashboard/grievance-board": "greivance-board",
  "/dashboard/greivance-board": "greivance-board",
  "/dashboard/profile-settings": "profile-settings",
};

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

export const getRouteBySidebarItem = (itemId: SidebarItemId): string =>
  sidebarRouteMap[itemId];

export const getSidebarItemByPathname = (pathname: string): SidebarItemId => {
  const normalizedPathname = normalizePathname(pathname);

  return pathToSidebarItemMap[normalizedPathname] ?? "log-shift";
};
