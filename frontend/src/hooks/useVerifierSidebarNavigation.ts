import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { VerifierSidebarItem, VerifierSidebarItemId } from "../types/verifier";

const verifierSidebarItems: VerifierSidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "verification-queue", label: "Verification Queue", icon: "briefcase" },
  { id: "verified-history", label: "Verified History", icon: "clock" },
  { id: "profile-settings", label: "My Profile / Settings", icon: "settings" },
];

const sidebarRouteMap: Record<VerifierSidebarItemId, string> = {
  dashboard: "/verifier/dashboard",
  "verification-queue": "/verifier/verification-queue",
  "verified-history": "/verifier/verified-history",
  "profile-settings": "/verifier/profile-settings",
};

const getSidebarItemByPathname = (pathname: string): VerifierSidebarItemId => {
 	if (pathname.startsWith("/verifier/verification-queue")) {
    return "verification-queue";
  }

  if (pathname.startsWith("/verifier/verified-history")) {
    return "verified-history";
  }

  if (pathname.startsWith("/verifier/profile-settings")) {
    return "profile-settings";
  }

  return "dashboard";
};

interface UseVerifierSidebarNavigationResult {
  sidebarItems: VerifierSidebarItem[];
  activeSidebarItem: VerifierSidebarItemId;
  onSidebarItemSelect: (itemId: VerifierSidebarItemId) => void;
}

export const useVerifierSidebarNavigation = (): UseVerifierSidebarNavigationResult => {
	const navigate = useNavigate();
	const location = useLocation();

	const activeSidebarItem = getSidebarItemByPathname(location.pathname);

	const onSidebarItemSelect = useCallback(
		(itemId: VerifierSidebarItemId) => {
			navigate(sidebarRouteMap[itemId]);
		},
		[navigate],
	);

	return {
		sidebarItems: verifierSidebarItems,
		activeSidebarItem,
		onSidebarItemSelect,
	};
};
