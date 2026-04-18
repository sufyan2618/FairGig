import { useMemo } from "react";
import { dashboardStats } from "../../data/dashboardData";
import type { DashboardStat } from "../../types/dashboard";

interface UseDashboardStatsApiResponse {
  data: DashboardStat[];
  isLoading: boolean;
  error: string | null;
}

export const useDashboardStatsApi = (): UseDashboardStatsApiResponse => {
  const data = useMemo(() => dashboardStats, []);

  return {
    data,
    isLoading: false,
    error: null,
  };
};
