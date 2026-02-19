import { useMemo } from "react";
import { useRepresentativesInfinite } from './useRepresentative';
import type { RepresentativeGetManyFormData } from '@/schemas';
import type { Representative } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_REPRESENTATIVES_PAGE_SIZE = 25;

export function useRepresentativesInfiniteMobile(params?: Partial<RepresentativeGetManyFormData> & { enabled?: boolean }) {
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_REPRESENTATIVES_PAGE_SIZE,
    }),
    [params],
  );

  const infiniteQuery = useRepresentativesInfinite(queryParams);
  const result = useInfiniteMobile<Representative>(infiniteQuery);

  return {
    ...result,
    representatives: result.items,
  };
}
