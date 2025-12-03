// packages/types/src/holiday.ts

import type {
  BaseEntity,
  BaseGetUniqueResponse,
  BaseGetManyResponse,
  BaseCreateResponse,
  BaseUpdateResponse,
  BaseDeleteResponse,
  BatchCreateResponse,
  BatchUpdateResponse,
  BatchDeleteResponse,
} from "./common";
import { HOLIDAY_TYPE } from '@/constants';

export interface Holiday extends BaseEntity {
  name: string;
  date: Date;
  type: HOLIDAY_TYPE | null;
}

export interface HolidayIncludes {
  _count?: boolean | { select?: Record<string, boolean> };
}

// =====================
// Response Types
// =====================

export type HolidayGetUniqueResponse = BaseGetUniqueResponse<Holiday>;
export type HolidayGetManyResponse = BaseGetManyResponse<Holiday>;
export type HolidayCreateResponse = BaseCreateResponse<Holiday>;
export type HolidayUpdateResponse = BaseUpdateResponse<Holiday>;
export type HolidayDeleteResponse = BaseDeleteResponse;
export type HolidayBatchCreateResponse<T> = BatchCreateResponse<T>;
export type HolidayBatchUpdateResponse<T> = BatchUpdateResponse<T>;
export type HolidayBatchDeleteResponse = BatchDeleteResponse;
