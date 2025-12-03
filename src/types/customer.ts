// packages/interfaces/src/customer.ts

import type { ORDER_BY_DIRECTION } from '@/constants';
import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse, BaseMergeResponse } from "./common";
import type { File, FileIncludes } from "./file";
import type { Task, TaskIncludes } from "./task";
import type { EconomicActivity, EconomicActivityIncludes } from "./economic-activity";

// =====================
// Main Entity Interface
// =====================

export interface Customer extends BaseEntity {
  fantasyName: string;
  name: string; // Alias for fantasyName
  cnpj: string | null;
  cpf: string | null;
  corporateName: string | null;
  email: string | null;
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  site: string | null;
  phones: string[];
  tags: string[];
  logoId: string | null;
  economicActivityId: string | null;
  situacaoCadastral: string | null;
  inscricaoEstadual: string | null;
  logradouro: string | null;

  // Relations
  logo?: File;
  economicActivity?: EconomicActivity;
  tasks?: Task[];

  // Count relations
  _count?: {
    tasks?: number;
    serviceOrders?: number;
    services?: number;
  };
}

// =====================
// Include Types
// =====================

export interface CustomerIncludes {
  logo?:
    | boolean
    | {
        include?: FileIncludes;
      };
  economicActivity?:
    | boolean
    | {
        include?: EconomicActivityIncludes;
      };
  tasks?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  _count?: {
    tasks?: boolean;
    serviceOrders?: boolean;
    services?: boolean;
  };
}

// =====================
// Order By Types
// =====================

export interface CustomerOrderBy {
  id?: ORDER_BY_DIRECTION;
  fantasyName?: ORDER_BY_DIRECTION;
  cnpj?: ORDER_BY_DIRECTION;
  cpf?: ORDER_BY_DIRECTION;
  corporateName?: ORDER_BY_DIRECTION;
  email?: ORDER_BY_DIRECTION;
  address?: ORDER_BY_DIRECTION;
  addressNumber?: ORDER_BY_DIRECTION;
  neighborhood?: ORDER_BY_DIRECTION;
  city?: ORDER_BY_DIRECTION;
  state?: ORDER_BY_DIRECTION;
  zipCode?: ORDER_BY_DIRECTION;
  site?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

// =====================
// Response Interfaces
// =====================

export type CustomerGetUniqueResponse = BaseGetUniqueResponse<Customer>;
export type CustomerGetManyResponse = BaseGetManyResponse<Customer>;
export type CustomerCreateResponse = BaseCreateResponse<Customer>;
export type CustomerUpdateResponse = BaseUpdateResponse<Customer>;
export type CustomerDeleteResponse = BaseDeleteResponse;
export type CustomerMergeResponse = BaseMergeResponse<Customer>;

// =====================
// Batch Operation Responses
// =====================

export type CustomerBatchCreateResponse = BaseBatchResponse<Customer, unknown>;
export type CustomerBatchUpdateResponse = BaseBatchResponse<Customer, unknown>;
export type CustomerBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
