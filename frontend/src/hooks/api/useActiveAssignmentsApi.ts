import { useMemo } from "react";
import { activeAssignments } from "../../data/dashboardData";
import type { ActiveAssignment } from "../../types/dashboard";

interface UseActiveAssignmentsApiResponse {
  data: ActiveAssignment[];
  isLoading: boolean;
  error: string | null;
}

export const useActiveAssignmentsApi = (): UseActiveAssignmentsApiResponse => {
  const data = useMemo(() => activeAssignments, []);

  return {
    data,
    isLoading: false,
    error: null,
  };
};
