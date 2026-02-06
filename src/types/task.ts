// packages/interfaces/src/task.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, TASK_STATUS, COMMISSION_STATUS } from '@/constants';
import type { Sector, SectorIncludes, SectorOrderBy } from "./sector";
import type { Customer, CustomerIncludes, CustomerOrderBy } from "./customer";
import type { File, FileIncludes } from "./file";
import type { Artwork, ArtworkIncludes } from "./artwork";
import type { Observation, ObservationIncludes } from "./observation";
import type { Paint, PaintIncludes, PaintOrderBy } from "./paint";
import type { User, UserIncludes, UserOrderBy } from "./user";
import type { ServiceOrder, ServiceOrderIncludes } from "./serviceOrder";
import type { Airbrushing, AirbrushingIncludes } from "./airbrushing";
import type { Cut, CutIncludes } from "./cut";
import type { Truck, TruckIncludes } from "./truck";
import type { Bonus, BonusIncludes } from "./bonus";
import type { BonusDiscount, BonusDiscountIncludes } from "./bonusDiscount";
import type { TaskPricing } from "./task-pricing";
import type { Representative } from "./representative";

// =====================
// Task Interface
// =====================

export interface Task extends BaseEntity {
  name: string;
  status: TASK_STATUS;
  statusOrder: number;
  commission: COMMISSION_STATUS | null;
  commissionOrder: number;
  serialNumber: string | null;
  // Note: chassisNumber and plate are now on the Truck entity (task.truck?.chassisNumber, task.truck?.plate)
  details: string | null;
  description?: string | null; // Alias for details
  entryDate: Date | null;
  term: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  forecastDate: Date | null;
  paintId: string | null;
  customerId: string | null;
  invoiceToId: string | null;
  sectorId: string | null;
  representatives?: Representative[];
  representativeIds?: string[];
  budgetIds?: string[];
  invoiceIds?: string[];
  receiptIds?: string[];
  reimbursementIds?: string[];
  reimbursementInvoiceIds?: string[];
  baseFileIds?: string[];
  createdById: string | null;
  bonusDiscountId?: string | null;
  pricingId?: string | null; // Foreign key to TaskPricing
  updatedById?: string | null; // ID of user who last updated
  priority?: number | null; // Task priority level
  measures?: string | null; // Task measures/dimensions
  price?: number | null; // Task price/value

  // Relations for updatedBy
  updatedBy?: User;

  // Relations
  sector?: Sector;
  customer?: Customer;
  invoiceTo?: Customer;

  // Multiple file support (array relations matching database schema)
  budgets?: File[];
  invoices?: File[];
  receipts?: File[];
  reimbursements?: File[];
  invoiceReimbursements?: File[];
  baseFiles?: File[]; // Files used as base for artwork design

  observation?: Observation;
  generalPainting?: Paint;
  createdBy?: User;
  artworks?: Artwork[];
  logoPaints?: Paint[];
  serviceOrders?: ServiceOrder[];
  pricing?: TaskPricing; // Task pricing (one-to-many: one pricing can be shared across multiple tasks)
  airbrushings?: Airbrushing[];
  cuts?: Cut[];
  truck?: Truck;
  relatedTasks?: Task[];
  relatedTo?: Task[];

  // Bonus relations
  bonuses?: Bonus[];
  bonusDiscount?: BonusDiscount;
}

// =====================
// Include Types
// =====================

export interface TaskIncludes {
  sector?:
    | boolean
    | {
        include?: SectorIncludes;
      };
  customer?:
    | boolean
    | {
        include?: CustomerIncludes;
      };

  // Multiple file includes (array relations)
  budgets?: boolean;
  invoices?: boolean;
  receipts?: boolean;
  reimbursements?: boolean;
  invoiceReimbursements?: boolean;

  observation?:
    | boolean
    | {
        include?: ObservationIncludes;
      };
  generalPainting?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  createdBy?:
    | boolean
    | {
        include?: UserIncludes;
      };
  artworks?:
    | boolean
    | {
        include?: ArtworkIncludes;
      };
  baseFiles?:
    | boolean
    | {
        include?: FileIncludes;
      };
  logoPaints?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  serviceOrders?:
    | boolean
    | {
        include?: ServiceOrderIncludes;
      };
  pricing?:
    | boolean
    | {
        include?: {
          items?: boolean;
          layoutFile?: boolean;
          customerSignature?: boolean;
        };
      };
  airbrushings?:
    | boolean
    | {
        include?: AirbrushingIncludes;
      };
  cuts?:
    | boolean
    | {
        include?: CutIncludes;
      };
  truck?:
    | boolean
    | {
        include?: TruckIncludes;
      };
  relatedTasks?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  relatedTo?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  bonuses?:
    | boolean
    | {
        include?: BonusIncludes;
      };
  bonusDiscount?:
    | boolean
    | {
        include?: BonusDiscountIncludes;
      };
}

// =====================
// OrderBy Types
// =====================

export interface TaskOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  commission?: ORDER_BY_DIRECTION;
  commissionOrder?: ORDER_BY_DIRECTION;
  serialNumber?: ORDER_BY_DIRECTION;
  // Note: chassisNumber and plate sorting removed - these are now on Truck entity
  details?: ORDER_BY_DIRECTION;
  entryDate?: ORDER_BY_DIRECTION;
  term?: ORDER_BY_DIRECTION;
  startedAt?: ORDER_BY_DIRECTION;
  finishedAt?: ORDER_BY_DIRECTION;
  paintId?: ORDER_BY_DIRECTION;
  customerId?: ORDER_BY_DIRECTION;
  sectorId?: ORDER_BY_DIRECTION;
  nfeId?: ORDER_BY_DIRECTION;
  receiptId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  sector?: SectorOrderBy;
  customer?: CustomerOrderBy;
  generalPainting?: PaintOrderBy;
  createdBy?: UserOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type TaskGetUniqueResponse = BaseGetUniqueResponse<Task>;
export type TaskGetManyResponse = BaseGetManyResponse<Task>;
export type TaskCreateResponse = BaseCreateResponse<Task>;
export type TaskUpdateResponse = BaseUpdateResponse<Task>;
export type TaskDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type TaskBatchCreateResponse<T> = BaseBatchResponse<Task, T>;
export type TaskBatchUpdateResponse<T> = BaseBatchResponse<Task, T & { id: string }>;
export type TaskBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
