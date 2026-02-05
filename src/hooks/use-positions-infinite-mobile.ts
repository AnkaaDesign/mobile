import { usePositionsInfinite } from './usePosition';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { PositionGetManyFormData } from '@/schemas';
import type { Position } from '@/types';

export function usePositionsInfiniteMobile(params?: PositionGetManyFormData) {
  const result = usePositionsInfinite(params || {});
  return useInfiniteMobile<Position>(result);
}
