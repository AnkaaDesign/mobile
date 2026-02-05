import { useActivitiesInfinite } from './useActivity';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { ActivityGetManyFormData } from '@/schemas';
import type { Activity } from '@/types';

const DEFAULT_MOBILE_PAGE_SIZE = 40;

// Optimized select for activities list - only fields displayed in table columns:
// - item.uniCode, item.name (CÓDIGO, PRODUTO)
// - user.name (COLABORADOR)
// - quantity, operation (QNT with badge)
// - reason (MOTIVO)
// - createdAt (DATA)
const ACTIVITY_LIST_SELECT = {
  id: true,
  quantity: true,
  operation: true,
  reason: true,
  createdAt: true,
  // Item - only code and name are displayed
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
    },
  },
  // User - only name is displayed
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const useActivitiesInfiniteMobile = (filters: Partial<ActivityGetManyFormData> = {}) => {
  // Base infinite query with mobile-optimized page size and select patterns
  const baseQuery = useActivitiesInfinite({
    limit: DEFAULT_MOBILE_PAGE_SIZE,
    ...filters,
    // Use optimized select - only fetch fields actually displayed in the list
    select: filters.select || ACTIVITY_LIST_SELECT,
  });

  return useInfiniteMobile<Activity>(baseQuery);
};