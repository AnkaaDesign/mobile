// packages/interfaces/src/vacation.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, VACATION_STATUS, VACATION_TYPE } from '@/constants';
import type { User, UserIncludes, UserOrderBy } from "./user";

// =====================
// Main Entity Interface
// =====================

export interface Vacation extends BaseEntity {
  userId: string | null;
  startAt: Date;
  endAt: Date;
  isCollective: boolean;
  status: VACATION_STATUS;
  statusOrder: number; // 1=Pendente, 2=Aprovado, 3=Rejeitado, 4=Ativo, 5=Concluído, 6=Cancelado
  type: VACATION_TYPE;
  typeOrder: number;
  daysRequested?: number; // Number of vacation days requested
  observation?: string | null; // Optional observation/notes
  approvedById?: string | null; // ID of user who approved

  // Relations
  user?: User;
  approvedBy?: User; // User who approved the vacation
}

// =====================
// Include Types
// =====================

export interface VacationIncludes {
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface VacationOrderBy {
  id?: ORDER_BY_DIRECTION;
  startAt?: ORDER_BY_DIRECTION;
  endAt?: ORDER_BY_DIRECTION;
  isCollective?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION; // NEW: Sort by numeric status order
  type?: ORDER_BY_DIRECTION;
  typeOrder?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  user?: UserOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type VacationGetUniqueResponse = BaseGetUniqueResponse<Vacation>;
export type VacationGetManyResponse = BaseGetManyResponse<Vacation>;
export type VacationCreateResponse = BaseCreateResponse<Vacation>;
export type VacationUpdateResponse = BaseUpdateResponse<Vacation>;
export type VacationDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type VacationBatchCreateResponse<T = any> = BaseBatchResponse<Vacation, T>;
export type VacationBatchUpdateResponse<T = any> = BaseBatchResponse<Vacation, T & { id: string }>;
export type VacationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
