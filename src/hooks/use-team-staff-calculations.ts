import { useQuery } from "@tanstack/react-query";
import { getTeamStaffCalculations } from "@/api-client";

// Query keys for team staff calculations
export const teamStaffCalculationsKeys = {
  all: ["team-staff", "calculations"] as const,
  list: (params?: any) => [...teamStaffCalculationsKeys.all, params] as const,
};

/**
 * Hook to fetch team staff Secullum calculations
 * Automatically filters calculations by the current user's managed sector on the backend
 * Requires team leader privileges
 */
export function useTeamStaffCalculations(
  params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    take?: number;
  },
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: teamStaffCalculationsKeys.list(params),
    queryFn: () => getTeamStaffCalculations(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: enabled && !!params?.userId && !!params?.startDate && !!params?.endDate,
  });
}
