import { useMemo } from "react";
import { useResponsiblesInfinite } from './useResponsible';
import type { ResponsibleGetManyFormData } from '@/schemas';
import type { Responsible } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_RESPONSIBLES_PAGE_SIZE = 25;

export function useResponsiblesInfiniteMobile(params?: Partial<ResponsibleGetManyFormData> & { enabled?: boolean }) {
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_RESPONSIBLES_PAGE_SIZE,
    }),
    [params],
  );

  const infiniteQuery = useResponsiblesInfinite(queryParams);
  const result = useInfiniteMobile<Responsible>(infiniteQuery);

  return {
    ...result,
    responsibles: result.items,
  };
}
