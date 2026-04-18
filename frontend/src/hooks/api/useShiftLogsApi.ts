import { useMemo } from "react";
import { shiftLogs } from "../../data/dashboardData";
import type { ShiftLog } from "../../types/dashboard";

interface UseShiftLogsApiResponse {
  data: ShiftLog[];
  isLoading: boolean;
  error: string | null;
}

export const useShiftLogsApi = (): UseShiftLogsApiResponse => {
  const data = useMemo(() => shiftLogs, []);

  return {
    data,
    isLoading: false,
    error: null,
  };
};
