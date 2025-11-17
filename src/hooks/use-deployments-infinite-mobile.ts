import { useMemo } from "react";
import { useDeploymentsInfinite } from './deployment';
import { DeploymentGetManyParams } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for deployments
const MOBILE_DEPLOYMENTS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling deployments
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useDeploymentsInfiniteMobile(params?: Partial<DeploymentGetManyParams> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_DEPLOYMENTS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useDeploymentsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
