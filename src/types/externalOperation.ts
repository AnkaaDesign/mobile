// packages/interfaces/src/externalOperation.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, EXTERNAL_OPERATION_STATUS, EXTERNAL_OPERATION_TYPE } from '@/constants';
import type { File, FileIncludes } from "./file";
import type { Item, ItemIncludes, ItemOrderBy } from "./item";
import type { Customer, CustomerIncludes } from "./customer";
import type { Invoice, Installment } from "./invoice";

// =====================
// Main Entity Interfaces
// =====================

export interface ExternalOperation extends BaseEntity {
  withdrawerName: string | null;
  type: EXTERNAL_OPERATION_TYPE;
  status: EXTERNAL_OPERATION_STATUS;
  statusOrder: number;
  invoiceIds?: string[];
  receiptIds?: string[];
  notes: string | null;
  totalPrice?: number;

  // Billing fields (CHARGEABLE withdrawals — "Operação Externa" billing)
  customerId: string | null;
  generateInvoice: boolean;
  generateBankSlip: boolean;
  paymentCondition: string | null;
  paymentConfig: Record<string, any> | null;
  billedAt: Date | null;

  // Relations (optional, populated based on query) — M:N File relations (plural)
  invoices?: File[];
  invoiceReimbursements?: File[];
  receipts?: File[];
  reimbursements?: File[];
  items?: ExternalOperationItem[];
  customer?: Customer | null;
  services?: ExternalOperationServiceItem[];
  billingInvoice?: Invoice | null;
  installments?: Installment[];
}

export interface ExternalOperationServiceItem extends BaseEntity {
  externalOperationId: string;
  description: string;
  amount: number;
  position: number;

  // Relations (optional, populated based on query)
  externalOperation?: ExternalOperation;
}

export interface ExternalOperationItem extends BaseEntity {
  externalOperationId: string;
  itemId: string;
  withdrawedQuantity: number;
  returnedQuantity: number;
  price: number | null;
  unitPrice?: number;

  // Relations (optional, populated based on query)
  externalOperation?: ExternalOperation;
  item?: Item;
}

// =====================
// Include Types
// =====================

export interface ExternalOperationIncludes {
  invoices?:
    | boolean
    | {
        include?: FileIncludes;
      };
  receipts?:
    | boolean
    | {
        include?: FileIncludes;
      };
  items?:
    | boolean
    | {
        include?: ExternalOperationItemIncludes;
      };
  customer?:
    | boolean
    | {
        include?: CustomerIncludes;
      };
  services?:
    | boolean
    | {
        orderBy?: any;
      };
  billingInvoice?:
    | boolean
    | {
        include?: {
          installments?:
            | boolean
            | {
                include?: {
                  bankSlip?: boolean;
                };
                orderBy?: any;
              };
          nfseDocuments?: boolean;
          customer?: boolean;
        };
      };
  installments?:
    | boolean
    | {
        include?: {
          bankSlip?: boolean;
        };
        orderBy?: any;
      };
}

export interface ExternalOperationItemIncludes {
  externalOperation?:
    | boolean
    | {
        include?: ExternalOperationIncludes;
      };
  item?:
    | boolean
    | {
        include?: ItemIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface ExternalOperationOrderBy {
  id?: ORDER_BY_DIRECTION;
  withdrawerName?: ORDER_BY_DIRECTION;
  type?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  notes?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface ExternalOperationItemOrderBy {
  id?: ORDER_BY_DIRECTION;
  externalOperationId?: ORDER_BY_DIRECTION;
  itemId?: ORDER_BY_DIRECTION;
  withdrawedQuantity?: ORDER_BY_DIRECTION;
  returnedQuantity?: ORDER_BY_DIRECTION;
  price?: ORDER_BY_DIRECTION;
  unitPrice?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  item?: ItemOrderBy;
  externalOperation?: ExternalOperationOrderBy;
}

// =====================
// Response Interfaces
// =====================

// ExternalOperation Responses
export type ExternalOperationGetUniqueResponse = BaseGetUniqueResponse<ExternalOperation>;
export type ExternalOperationGetManyResponse = BaseGetManyResponse<ExternalOperation>;
export type ExternalOperationCreateResponse = BaseCreateResponse<ExternalOperation>;
export type ExternalOperationUpdateResponse = BaseUpdateResponse<ExternalOperation>;
export type ExternalOperationDeleteResponse = BaseDeleteResponse;

// ExternalOperationItem Responses
export type ExternalOperationItemGetUniqueResponse = BaseGetUniqueResponse<ExternalOperationItem>;
export type ExternalOperationItemGetManyResponse = BaseGetManyResponse<ExternalOperationItem>;
export type ExternalOperationItemCreateResponse = BaseCreateResponse<ExternalOperationItem>;
export type ExternalOperationItemUpdateResponse = BaseUpdateResponse<ExternalOperationItem>;
export type ExternalOperationItemDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// ExternalOperation Batch Operations
export type ExternalOperationBatchCreateResponse<T = any> = BaseBatchResponse<ExternalOperation, T>;
export type ExternalOperationBatchUpdateResponse<T = any> = BaseBatchResponse<ExternalOperation, T & { id: string }>;
export type ExternalOperationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// ExternalOperationItem Batch Operations
export type ExternalOperationItemBatchCreateResponse<T = any> = BaseBatchResponse<ExternalOperationItem, T>;
export type ExternalOperationItemBatchUpdateResponse<T = any> = BaseBatchResponse<ExternalOperationItem, T & { id: string }>;
export type ExternalOperationItemBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
