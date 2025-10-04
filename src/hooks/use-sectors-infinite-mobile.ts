import { useSectorsInfinite } from './';
import type { SectorGetManyFormData } from '../types';
import { useInfiniteMobile } from "./use-infinite-mobile";

/**
 * Mobile-optimized infinite scroll hook for sectors
 * Provides flattened data, loading states, and error handling
 */
export function useSectorsInfiniteMobile(params?: SectorGetManyFormData) {
  const infiniteQuery = useSectorsInfinite(params);
  return useInfiniteMobile(infiniteQuery);
}
