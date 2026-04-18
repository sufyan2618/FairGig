import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SidebarItemId } from "../types/dashboard";
import {
  getRouteBySidebarItem,
  getSidebarItemByPathname,
} from "../utils/dashboard/sidebarRoutes";

interface UseSidebarNavigationResult {
  activeSidebarItem: SidebarItemId;
  onSidebarItemSelect: (itemId: SidebarItemId) => void;
}

export const useSidebarNavigation = (): UseSidebarNavigationResult => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeSidebarItem = getSidebarItemByPathname(location.pathname);

  const onSidebarItemSelect = useCallback(
    (itemId: SidebarItemId) => {
      navigate(getRouteBySidebarItem(itemId));
    },
    [navigate],
  );

  return {
    activeSidebarItem,
    onSidebarItemSelect,
  };
};
