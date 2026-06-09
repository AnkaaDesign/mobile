// packages/interfaces/src/airbrushing.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { AIRBRUSHING_STATUS, AIRBRUSHING_PAYMENT_STATUS, ORDER_BY_DIRECTION } from '@/constants';
import type { Task, TaskIncludes, TaskOrderBy } from "./task";
import type { File, FileIncludes } from "./file";
import type { Artwork, ArtworkIncludes } from "./artwork";
import type { User, UserIncludes } from "./user";

// =====================
// Main Entity Interface
// =====================

export interface Airbrushing extends BaseEntity {
  startDate: Date | null; // Expected start date ("Início Previsto")
  finishDate: Date | null; // Expected finish date ("Término Previsto")
  startedAt: Date | null; // Actual start date ("Iniciado em")
  finishedAt: Date | null; // Actual finish date ("Finalizado em")
  price: number | null;
  status: AIRBRUSHING_STATUS; // "Pendente", "Em Andamento", "Finalizado"
  statusOrder: number; // 1=Pendente, 2=Em Andamento, 3=Finalizado
  paymentStatus: AIRBRUSHING_PAYMENT_STATUS;
  taskId: string;
  painterId?: string | null;
  observations?: string | null; // Additional observations

  // Relations (optional, populated based on query)
  task?: Task;
  painter?: User | null;
  receipts?: File[];
  invoices?: File[];
  artworks?: Artwork[];
}

// =====================
// Include Types
// =====================

export interface AirbrushingIncludes {
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  receipts?:
    | boolean
    | {
        include?: FileIncludes;
      };
  invoices?:
    | boolean
    | {
        include?: FileIncludes;
      };
  artworks?:
    | boolean
    | {
        include?: ArtworkIncludes;
      };
  painter?:
    | boolean
    | {
        include?: UserIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface AirbrushingOrderBy {
  id?: ORDER_BY_DIRECTION;
  startDate?: ORDER_BY_DIRECTION;
  finishDate?: ORDER_BY_DIRECTION;
  startedAt?: ORDER_BY_DIRECTION;
  finishedAt?: ORDER_BY_DIRECTION;
  price?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  paymentStatus?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  task?: TaskOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type AirbrushingGetUniqueResponse = BaseGetUniqueResponse<Airbrushing>;
export type AirbrushingGetManyResponse = BaseGetManyResponse<Airbrushing>;
export type AirbrushingCreateResponse = BaseCreateResponse<Airbrushing>;
export type AirbrushingUpdateResponse = BaseUpdateResponse<Airbrushing>;
export type AirbrushingDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type AirbrushingBatchCreateResponse<T = any> = BaseBatchResponse<Airbrushing, T>;
export type AirbrushingBatchUpdateResponse<T = any> = BaseBatchResponse<Airbrushing, T & { id: string }>;
export type AirbrushingBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
