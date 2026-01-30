/**
 * Utility functions for task filtering based on sector leadership
 *
 * These functions can be used in config files (non-React context) to fetch
 * tasks that are filtered based on the current user's sector leadership.
 *
 * Team leaders should only see:
 * 1. Tasks from their managed sector
 * 2. Tasks without a sector assigned (sectorId = null)
 */

import { getUserData } from './storage';
import { SECTOR_PRIVILEGES } from '@/constants';

interface TaskFilterUser {
  sector?: { privileges?: string } | null;
  managedSector?: { id?: string } | null;
}

/**
 * Check if user is a team leader (manages a sector)
 */
function isTeamLeader(user: TaskFilterUser | null): boolean {
  if (!user) return false;
  return Boolean(user.managedSector?.id);
}

/**
 * Check if user is admin
 */
function isAdmin(user: TaskFilterUser | null): boolean {
  if (!user) return false;
  return user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;
}

/**
 * Get sector IDs that the user can see tasks for
 * Returns null if user can see all tasks (admin or non-team-leader)
 */
export async function getUserAllowedSectorIds(): Promise<string[] | null> {
  try {
    const user = await getUserData();

    // Admin can see all tasks
    if (isAdmin(user)) return null;

    // Non-team-leaders can see all tasks (permission checks happen elsewhere)
    if (!isTeamLeader(user)) return null;

    // Team leaders can only see tasks from their managed sector
    const managedSectorId = user?.managedSector?.id;
    if (managedSectorId) {
      return [managedSectorId];
    }

    return null;
  } catch (error) {
    console.error('[task-filter] Error getting user data:', error);
    return null;
  }
}

/**
 * Check if current user should have sector filtering applied to task queries
 */
export async function shouldFilterTasksBySector(): Promise<boolean> {
  try {
    const user = await getUserData();

    // Admin can see all tasks
    if (isAdmin(user)) return false;

    // Only team leaders should have sector filtering
    return isTeamLeader(user);
  } catch (error) {
    console.error('[task-filter] Error checking sector filter:', error);
    return false;
  }
}

/**
 * Get the current user's managed sector ID (if they are a team leader)
 * Returns null if user is admin, not a team leader, or has no managed sector
 */
export async function getManagedSectorId(): Promise<string | null> {
  try {
    const user = await getUserData();

    // Admin can see all tasks
    if (isAdmin(user)) return null;

    // Non-team-leaders don't have a managed sector for filtering purposes
    if (!isTeamLeader(user)) return null;

    return user?.managedSector?.id || null;
  } catch (error) {
    console.error('[task-filter] Error getting managed sector:', error);
    return null;
  }
}

interface FetchTasksForFilterOptions {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, any>;
}

interface FetchTasksForFilterResult {
  data: Array<{ label: string; value: string }>;
  hasMore: boolean;
  total?: number;
}

/**
 * Fetch tasks for filter selectors with sector-based filtering
 *
 * This function should be used in config files where task selectors are needed.
 * It automatically applies sector filtering for team leaders.
 *
 * Usage in config:
 * ```typescript
 * queryFn: async (searchTerm: string, page: number = 1) => {
 *   return fetchTasksForFilter({
 *     searchTerm,
 *     page,
 *     pageSize: 20,
 *     orderBy: { createdAt: 'desc' },
 *   });
 * }
 * ```
 */
export async function fetchTasksForFilter(
  options: FetchTasksForFilterOptions = {}
): Promise<FetchTasksForFilterResult> {
  const { searchTerm, page = 1, pageSize = 20, orderBy = { createdAt: 'desc' }, where } = options;

  try {
    const { getTasks } = await import('@/api-client');

    // Check if sector filtering is needed
    const managedSectorId = await getManagedSectorId();

    // Build where clause
    let whereClause: Record<string, any> = { ...where };

    // Add search filter if provided
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { customer: { fantasyName: { contains: searchTerm, mode: 'insensitive' } } },
        { plate: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // If user is a team leader, we need to filter by sector
    // They should see: tasks from their sector OR tasks with no sector
    // Since the API doesn't support OR on sectorId easily, we'll fetch and filter client-side
    const response = await getTasks({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        customer: true,
        sector: true,
      },
      orderBy,
      limit: managedSectorId ? pageSize * 3 : pageSize, // Fetch more if filtering
      page,
    });

    let tasks = response.data || [];

    // Apply sector filtering for team leaders (client-side)
    if (managedSectorId) {
      tasks = tasks.filter(
        (task: any) => task.sectorId === managedSectorId || task.sectorId === null
      );
      // Slice to page size after filtering
      tasks = tasks.slice(0, pageSize);
    }

    // Map to filter options format
    const data = tasks.map((task: any) => ({
      label: task.name ||
        (task.customer?.fantasyName ? `${task.customer.fantasyName}` : '') ||
        `#${task.id.slice(-8).toUpperCase()}`,
      value: task.id,
    }));

    return {
      data,
      hasMore: response.meta?.hasNextPage ?? false,
      total: response.meta?.totalRecords,
    };
  } catch (error) {
    console.error('[task-filter] Error fetching tasks:', error);
    return { data: [], hasMore: false };
  }
}
