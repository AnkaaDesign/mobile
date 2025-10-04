import { usePositionsInfinite } from './';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { PositionGetManyFormData } from '../schemas';

export function usePositionsInfiniteMobile(params?: PositionGetManyFormData) {
  const result = usePositionsInfinite(params || {});
  return useInfiniteMobile(result);
}
