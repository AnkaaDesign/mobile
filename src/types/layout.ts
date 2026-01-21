// packages/types/src/layout.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { File } from "./file";
import type { Truck } from "./truck";
import type { LayoutSection } from "./layoutSection";

// =====================
// Main Entity Interface
// =====================

export interface Layout extends BaseEntity {
  // Dimensions
  height: number;

  // Relations
  layoutSections?: LayoutSection[];

  photoId: string | null;
  photo?: File;

  // Inverse relations (one-to-many with specific sides)
  trucksLeftSide?: Truck[];
  trucksRightSide?: Truck[];
  trucksBackSide?: Truck[];

  // UI display
  usageCount?: number;
}

// =====================
// Response Types
// =====================

export type LayoutGetUniqueResponse = BaseGetUniqueResponse<Layout>;
export type LayoutGetManyResponse = BaseGetManyResponse<Layout>;
export type LayoutCreateResponse = BaseCreateResponse<Layout>;
export type LayoutUpdateResponse = BaseUpdateResponse<Layout>;
export type LayoutDeleteResponse = BaseDeleteResponse;

export type LayoutBatchCreateResponse<T> = BaseBatchResponse<Layout, T>;
export type LayoutBatchUpdateResponse<T> = BaseBatchResponse<Layout, T & { id: string }>;
export type LayoutBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// =====================
// Include Types
// =====================

export interface LayoutIncludes {
  photo?: boolean;
  layoutSections?: boolean;
  trucksLeftSide?: boolean;
  trucksRightSide?: boolean;
  trucksBackSide?: boolean;
}
