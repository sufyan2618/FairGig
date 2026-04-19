import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../common/Icon";
import { useAuthApi } from "../../hooks/api/useAuthApi";
import { useAuthStore } from "../../store/authStore";
import type { UserRole } from "../../types/auth";

interface TopHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export const TopHeader = (_props: TopHeaderProps) => <TopHeaderContent />;

const getProfileRouteForRole = (role?: UserRole) => {
  if (role === "advocate") {
    return "/advocate/profile-settings";
  }

  if (role === "verifier") {
    return "/verifier/profile-settings";
  }

  return "/dashboard/profile-settings";
};

const STATIC_HEADER_TITLES: Record<string, string> = {
  "/advocate/dashboard": "Dashboard",
  "/advocate/commission-tracker": "Commission Rate Tracker",
  "/advocate/complaint-analytics": "Complaint Analytics",
  "/advocate/grievance-board": "Grievance Board",
  "/advocate/income-distribution-map": "Income Distribution Map",
  "/advocate/vulnerability-flags": "Vulnerability Flags",
  "/advocate/profile-settings": "Profile Settings",
  "/dashboard": "Dashboard",
  "/dashboard/log-shift": "Log Shift",
  "/dashboard/my-earnings": "My Earnings",
  "/dashboard/my-analytics": "My Analytics",
  "/dashboard/income-certificate": "Income Certificate",
  "/dashboard/grievance-board": "Grievance Board",
  "/dashboard/greivance-board": "Grievance Board",
  "/dashboard/profile-settings": "Profile Settings",
  "/dashboard/upload-screenshot": "Upload Screenshot",
  "/dashboard/upload-screenshots": "Upload Screenshot",
  "/verifier": "Dashboard",
  "/verifier/dashboard": "Dashboard",
  "/verifier/verification-queue": "Verification Queue",
  "/verifier/verified-history": "Verified History",
  "/verifier/profile-settings": "Profile Settings",
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getHeaderTitle = (pathname: string) => {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (normalizedPath.startsWith("/verifier/verification-queue/") && normalizedPath.endsWith("/review")) {
    return "Verification Review";
  }

  const staticTitle = STATIC_HEADER_TITLES[normalizedPath];

  if (staticTitle) {
    return staticTitle;
  }

  const lastSegment = normalizedPath.split("/").filter(Boolean).pop();

  if (!lastSegment) {
    return "Dashboard";
  }

  return toTitleCase(lastSegment.replace(/-/g, " "));
};

const TopHeaderContent = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, isLoading } = useAuthApi();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = user?.full_name?.trim() || user?.email || "FairGig User";
  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : "Worker";
  const headerTitle = getHeaderTitle(location.pathname);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleOpenProfile = () => {
    navigate(getProfileRouteForRole(user?.role));
  };

  const handleLogout = () => {
    if (isLoggingOut || isLoading) {
      return;
    }

    setIsLoggingOut(true);

    void (async () => {
      await logout();

      navigate("/login", {
        replace: true,
        state: {
          toast: {
            message: "Signed out successfully.",
            tone: "success",
          },
        },
      });
    })();
  };

  return (
    <header className="animate-fade-in relative z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f5f6f8]/95 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1d]">{headerTitle}</h1>
        <p className="mt-1 text-sm text-[#5e6677]">
          Signed in as <span className="font-medium text-[#1d1d1d]">{displayName}</span>
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
        <span className="rounded-full border border-[#d9dde4] bg-white px-3 py-2 text-xs font-semibold tracking-wide text-[#3c465b]">
          {roleLabel}
        </span>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d9dde4] bg-white px-3.5 py-2 text-sm font-medium text-[#4a5568] transition-colors hover:bg-[#f1f3f6] hover:text-[#1d1d1d]"
        >
          <Icon name="clock" className="h-4 w-4" />
          Refresh Data
        </button>

        <button
          type="button"
          onClick={handleOpenProfile}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d9dde4] bg-white px-3.5 py-2 text-sm font-medium text-[#4a5568] transition-colors hover:bg-[#f1f3f6] hover:text-[#1d1d1d]"
        >
          <Icon name="user" className="h-4 w-4" />
          My Profile
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut || isLoading}
          className="rounded-xl border border-[#d9dde4] bg-white px-3.5 py-2 text-sm font-medium text-[#4a5568] transition-colors hover:bg-[#f1f3f6] hover:text-[#1d1d1d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut || isLoading ? "Signing out..." : "Logout"}
        </button>
      </div>
    </header>
  );
};
