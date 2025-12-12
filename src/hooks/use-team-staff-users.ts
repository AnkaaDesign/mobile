import { useQuery } from "@tanstack/react-query";
import { getTeamStaffUsers } from "@/api-client";

// Query keys for team staff users
export const teamStaffUsersKeys = {
  all: ["team-staff", "users"] as const,
  list: (params?: any) => [...teamStaffUsersKeys.all, params] as const,
};

/**
 * Hook to fetch team staff users
 * Automatically filters users by the current user's managed sector on the backend
 * Requires team leader privileges
 */
export function useTeamStaffUsers(params?: any, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: teamStaffUsersKeys.list(params),
    queryFn: () => getTeamStaffUsers(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled,
  });
}
