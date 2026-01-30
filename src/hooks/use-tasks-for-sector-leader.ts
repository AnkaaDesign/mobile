/**
 * Hook for fetching tasks filtered by sector leadership
 *
 * Team leaders (users who manage a sector) should only see:
 * 1. Tasks from their managed sector
 * 2. Tasks without a sector assigned (sectorId = null)
 *
 * Admin users can see all tasks.
 *
 * This hook should be used in task selectors/comboboxes where
 * sector-based filtering is required.
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasksInfiniteMobile } from './use-tasks-infinite-mobile';
import { isTeamLeader } from '@/utils';
import { SECTOR_PRIVILEGES } from '@/constants';
import type { TaskGetManyFormData } from '@/schemas';
import type { Task } from '@/types';

interface UseTasksForSectorLeaderParams extends Partial<TaskGetManyFormData> {
  enabled?: boolean;
}

/**
 * Filter tasks based on user's sector leadership
 * - Admin: sees all tasks
 * - Team leader: sees tasks from their managed sector + tasks without sector
 * - Other users: sees all tasks (they shouldn't have edit access anyway)
 */
export function filterTasksForSectorLeader(
  tasks: Task[],
  user: {
    sector?: { privileges?: string } | null;
    managedSector?: { id?: string } | null
  } | null
): Task[] {
  if (!user) return [];

  // Admin can see all tasks
  const isAdmin = user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;
  if (isAdmin) return tasks;

  // Check if user is a team leader
  const managedSectorId = user.managedSector?.id;
  if (!managedSectorId) {
    // Non-team-leaders see all tasks (permission checks happen elsewhere)
    return tasks;
  }

  // Team leaders only see tasks from their managed sector OR tasks without a sector
  return tasks.filter(task =>
    task.sectorId === managedSectorId || task.sectorId === null
  );
}

/**
 * Hook that fetches tasks and filters them based on user's sector leadership
 *
 * Usage:
 * ```tsx
 * const { data: tasks, isLoading } = useTasksForSectorLeader({
 *   orderBy: { name: 'asc' },
 *   enabled: true,
 * });
 * ```
 */
export function useTasksForSectorLeader(params?: UseTasksForSectorLeaderParams) {
  const { user } = useAuth();

  // Fetch all tasks (we'll filter client-side for the OR condition: managed sector OR null sector)
  const { data: rawTasks, ...queryResult } = useTasksInfiniteMobile({
    ...params,
    // Include sector info for filtering
    include: {
      ...params?.include,
      sector: true,
      customer: true,
    },
  });

  // Filter tasks based on sector leadership
  const filteredTasks = useMemo(() => {
    if (!rawTasks) return [];
    return filterTasksForSectorLeader(rawTasks, user);
  }, [rawTasks, user]);

  return {
    ...queryResult,
    data: filteredTasks,
  };
}

/**
 * Get task options for combobox, pre-filtered for sector leadership
 *
 * Usage:
 * ```tsx
 * const taskOptions = useTaskOptionsForSectorLeader({
 *   labelKey: 'name',
 *   orderBy: { name: 'asc' },
 * });
 * ```
 */
export function useTaskOptionsForSectorLeader(params?: UseTasksForSectorLeaderParams & {
  labelKey?: keyof Task | ((task: Task) => string);
}) {
  const { labelKey = 'name', ...queryParams } = params || {};
  const { data: tasks, ...queryResult } = useTasksForSectorLeader(queryParams);

  const options = useMemo(() => {
    const getLabel = typeof labelKey === 'function'
      ? labelKey
      : (task: Task) => {
          const value = task[labelKey as keyof Task];
          if (typeof value === 'string') return value;
          if (task.name) return task.name;
          if (task.customer?.fantasyName) return task.customer.fantasyName;
          return `#${task.id.slice(-8).toUpperCase()}`;
        };

    return tasks.map(task => ({
      value: task.id,
      label: getLabel(task),
    }));
  }, [tasks, labelKey]);

  return {
    ...queryResult,
    options,
    tasks,
  };
}
