// packages/interfaces/src/sector.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, SECTOR_PRIVILEGES } from '@/constants';
import type { User, UserIncludes } from "./user";
import type { Task, TaskIncludes } from "./task";

// =====================
// Main Entity Interface
// =====================

export interface Sector extends BaseEntity {
  name: string;
  privileges: SECTOR_PRIVILEGES;
  color?: string;

  // Relations
  users?: User[];
  tasks?: Task[];
  managedByUsers?: User[];

  // Count fields (when included)
  _count?: {
    users?: number;
    tasks?: number;
  };
}

// =====================
// Include Types
// =====================

export interface SectorIncludes {
  users?:
    | boolean
    | {
        include?: UserIncludes;
        orderBy?: any;
      };
  tasks?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  managedByUsers?:
    | boolean
    | {
        include?: UserIncludes;
      };
  changelogs?:
    | boolean
    | {
        include?: any;
        orderBy?: any;
        take?: number;
      };
  _count?:
    | boolean
    | {
        select?: {
          users?: boolean;
          tasks?: boolean;
        };
      };
}

// =====================
// Order By Types
// =====================

export interface SectorOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  privileges?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

// =====================
// Response Interfaces
// =====================

export type SectorGetUniqueResponse = BaseGetUniqueResponse<Sector>;
export type SectorGetManyResponse = BaseGetManyResponse<Sector>;
export type SectorCreateResponse = BaseCreateResponse<Sector>;
export type SectorUpdateResponse = BaseUpdateResponse<Sector>;
export type SectorDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type SectorBatchCreateResponse<T = any> = BaseBatchResponse<Sector, T>;
export type SectorBatchUpdateResponse<T = any> = BaseBatchResponse<Sector, T & { id: string }>;
export type SectorBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// =====================
// Form Data Types
// =====================

export interface SectorCreateFormData {
  name: string;
  privileges: SECTOR_PRIVILEGES;
}

export interface SectorUpdateFormData {
  name?: string;
  privileges?: SECTOR_PRIVILEGES;
}

export interface SectorGetManyFormData {
  page?: number;
  limit?: number;
  take?: number;
  skip?: number;
  where?: any;
  orderBy?: SectorOrderBy | SectorOrderBy[];
  include?: SectorIncludes;
  searchingFor?: string;
  privilege?: SECTOR_PRIVILEGES;
  hasUsers?: boolean;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  updatedAt?: {
    gte?: Date;
    lte?: Date;
  };
  [key: string]: unknown;
}

export interface SectorBatchCreateFormData {
  sectors: SectorCreateFormData[];
}

export interface SectorBatchUpdateFormData {
  sectors: {
    id: string;
    data: SectorUpdateFormData;
  }[];
}

export interface SectorBatchDeleteFormData {
  sectorIds: string[];
}
