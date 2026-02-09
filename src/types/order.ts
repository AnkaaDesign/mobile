// packages/interfaces/src/order.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_STATUS, PAYMENT_METHOD, SCHEDULE_FREQUENCY, WEEK_DAY, MONTH, ORDER_TRIGGER_TYPE, ORDER_BY_DIRECTION, RESCHEDULE_REASON } from '@/constants';
import type { Supplier, SupplierIncludes, SupplierOrderBy } from "./supplier";
import type { Item, ItemIncludes, ItemOrderBy, ItemWhere } from "./item";
import type { File, FileIncludes } from "./file";
import type {
  PpeDeliverySchedule,
  PpeDeliveryScheduleIncludes,
  WeeklyScheduleConfig,
  MonthlyScheduleConfig,
  YearlyScheduleConfig,
  WeeklyScheduleConfigIncludes,
  MonthlyScheduleConfigIncludes,
  YearlyScheduleConfigIncludes,
} from "./ppe";
import type { Activity, ActivityIncludes, ActivityOrderBy } from "./activity";

// =====================
// Order Schedule Interfaces
// =====================

export interface OrderSchedule extends BaseEntity {
  name: string | null;
  description: string | null;
  frequency: SCHEDULE_FREQUENCY;
  frequencyCount: number;
  isActive: boolean;
  items: string[];

  // Supplier relation
  supplierId: string | null;

  // Specific scheduling fields
  specificDate: Date | null;
  dayOfMonth: number | null;
  dayOfWeek: WEEK_DAY | null;
  month: MONTH | null;
  customMonths: MONTH[];

  // Reschedule fields
  rescheduleCount: number;
  originalDate: Date | null;
  lastRescheduleDate: Date | null;
  rescheduleReason: RESCHEDULE_REASON | null;

  // Schedule configuration relations
  weeklyConfigId: string | null;
  monthlyConfigId: string | null;
  yearlyConfigId: string | null;

  nextRun: Date | null;
  lastRun: Date | null;
  finishedAt: Date | null;
  lastRunId: string | null;
  originalScheduleId: string | null;

  // Relations (optional, populated based on query)
  supplier?: Supplier;
  weeklyConfig?: WeeklyScheduleConfig;
  monthlyConfig?: MonthlyScheduleConfig;
  yearlyConfig?: YearlyScheduleConfig;
  order?: Order;
}

// =====================
// Order Rule Interface
// =====================

export interface OrderRule extends BaseEntity {
  itemId: string;
  supplierId: string | null;
  isActive: boolean;
  priority: number;
  triggerType: ORDER_TRIGGER_TYPE;
  consumptionDays: number | null;
  safetyStockDays: number | null;
  minOrderQuantity: number | null;
  maxOrderQuantity: number | null;
  orderMultiple: number | null;

  // Relations (optional, populated based on query)
  item?: Item;
  supplier?: Supplier;
}

// =====================
// Order Item Interface
// =====================

export interface OrderItem extends BaseEntity {
  orderId: string;
  itemId: string | null;
  temporaryItemDescription: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  price: number;
  unitPrice?: number;
  icms: number;
  ipi: number;
  receivedAt: Date | null;
  fulfilledAt: Date | null;

  // Relations (optional, populated based on query)
  item?: Item;
  order?: Order;
  activities?: Activity[];
}

// =====================
// Main Order Interface
// =====================

export interface Order extends BaseEntity {
  description: string;
  forecast: Date | null;
  status: ORDER_STATUS;
  statusOrder: number; // Status numeric order for sorting: 1=Created, 2=PartiallyFulfilled, 3=Fulfilled, 4=Overdue, 5=PartiallyReceived, 6=Received, 7=Cancelled
  budgetIds?: string[];
  invoiceIds?: string[];
  receiptIds?: string[];
  reimbursementIds?: string[];
  reimbursementInvoiceIds?: string[];
  supplierId: string | null;
  orderScheduleId: string | null;
  orderRuleId: string | null;
  ppeScheduleId: string | null;
  notes: string | null;
  paymentMethod: PAYMENT_METHOD | null;
  paymentPix: string | null;
  paymentDueDays: number | null;

  // Relations (optional, populated based on query)
  budgets?: File[];
  invoices?: File[];
  receipts?: File[];
  reimbursements?: File[];
  invoiceReimbursements?: File[];
  supplier?: Supplier;
  orderSchedule?: OrderSchedule;
  ppeSchedule?: PpeDeliverySchedule;
  items?: OrderItem[];
  activities?: Activity[];

  // Prisma count fields
  _count?: {
    items?: number;
    activities?: number;
  };
}

// =====================
// Include Types
// =====================

export interface OrderIncludes {
  budgets?:
    | boolean
    | {
        include?: FileIncludes;
      };
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
  reimbursements?:
    | boolean
    | {
        include?: FileIncludes;
      };
  invoiceReimbursements?:
    | boolean
    | {
        include?: FileIncludes;
      };
  supplier?:
    | boolean
    | {
        include?: SupplierIncludes;
      };
  orderSchedule?:
    | boolean
    | {
        include?: OrderScheduleIncludes;
      };
  ppeSchedule?:
    | boolean
    | {
        include?: PpeDeliveryScheduleIncludes;
      };
  items?:
    | boolean
    | {
        include?: OrderItemIncludes;
        where?: OrderItemWhere;
        orderBy?: OrderItemOrderBy;
        take?: number;
        skip?: number;
      };
  activities?:
    | boolean
    | {
        include?: ActivityIncludes;
        where?: any; // ActivityWhere not yet defined
        orderBy?: ActivityOrderBy;
        take?: number;
        skip?: number;
      };
}

export interface OrderItemIncludes {
  item?:
    | boolean
    | {
        include?: ItemIncludes;
        where?: ItemWhere;
        orderBy?: ItemOrderBy;
      };
  order?:
    | boolean
    | {
        include?: OrderIncludes;
        where?: OrderWhere;
        orderBy?: OrderOrderBy;
      };
  activities?:
    | boolean
    | {
        include?: ActivityIncludes;
        where?: any; // ActivityWhere not yet defined
        orderBy?: ActivityOrderBy;
      };
}

export interface OrderScheduleIncludes {
  supplier?:
    | boolean
    | {
        include?: SupplierIncludes;
      };
  weeklyConfig?:
    | boolean
    | {
        include?: WeeklyScheduleConfigIncludes;
      };
  monthlyConfig?:
    | boolean
    | {
        include?: MonthlyScheduleConfigIncludes;
      };
  yearlyConfig?:
    | boolean
    | {
        include?: YearlyScheduleConfigIncludes;
      };
  order?:
    | boolean
    | {
        include?: OrderIncludes;
      };
}

export interface OrderRuleIncludes {
  item?:
    | boolean
    | {
        include?: ItemIncludes;
      };
  supplier?:
    | boolean
    | {
        include?: SupplierIncludes;
      };
}

// =====================
// Where Types
// =====================

export interface OrderWhere {
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  description?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive" };
  status?: ORDER_STATUS | { equals?: ORDER_STATUS; not?: ORDER_STATUS; in?: ORDER_STATUS[]; notIn?: ORDER_STATUS[] };
  statusOrder?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  supplierId?: string | null | { equals?: string | null; not?: string | null; in?: string[]; notIn?: string[] };
  forecast?: Date | null | { equals?: Date | null; not?: Date | null; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  AND?: OrderWhere | OrderWhere[];
  OR?: OrderWhere[];
  NOT?: OrderWhere | OrderWhere[];
}

export interface OrderItemWhere {
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  orderId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  itemId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  orderedQuantity?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  receivedQuantity?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  price?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  icms?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  ipi?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  receivedAt?: Date | null | { equals?: Date | null; not?: Date | null; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  fulfilledAt?: Date | null | { equals?: Date | null; not?: Date | null; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  AND?: OrderItemWhere | OrderItemWhere[];
  OR?: OrderItemWhere[];
  NOT?: OrderItemWhere | OrderItemWhere[];
}

export interface OrderScheduleWhere {
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  frequency?: SCHEDULE_FREQUENCY | { equals?: SCHEDULE_FREQUENCY; not?: SCHEDULE_FREQUENCY; in?: SCHEDULE_FREQUENCY[]; notIn?: SCHEDULE_FREQUENCY[] };
  isActive?: boolean | { equals?: boolean; not?: boolean };
  nextRun?: Date | null | { equals?: Date | null; not?: Date | null; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  lastRun?: Date | null | { equals?: Date | null; not?: Date | null; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  AND?: OrderScheduleWhere | OrderScheduleWhere[];
  OR?: OrderScheduleWhere[];
  NOT?: OrderScheduleWhere | OrderScheduleWhere[];
}

export interface OrderRuleWhere {
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  itemId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  supplierId?: string | null | { equals?: string | null; not?: string | null; in?: string[]; notIn?: string[] };
  isActive?: boolean | { equals?: boolean; not?: boolean };
  triggerType?: ORDER_TRIGGER_TYPE | { equals?: ORDER_TRIGGER_TYPE; not?: ORDER_TRIGGER_TYPE; in?: ORDER_TRIGGER_TYPE[]; notIn?: ORDER_TRIGGER_TYPE[] };
  priority?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number };
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date };
  AND?: OrderRuleWhere | OrderRuleWhere[];
  OR?: OrderRuleWhere[];
  NOT?: OrderRuleWhere | OrderRuleWhere[];
}

// =====================
// Order By Types
// =====================

export interface OrderOrderBy {
  id?: ORDER_BY_DIRECTION;
  description?: ORDER_BY_DIRECTION;
  forecast?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  notes?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  supplier?: SupplierOrderBy;
}

export interface OrderItemOrderBy {
  id?: ORDER_BY_DIRECTION;
  orderedQuantity?: ORDER_BY_DIRECTION;
  receivedQuantity?: ORDER_BY_DIRECTION;
  price?: ORDER_BY_DIRECTION;
  icms?: ORDER_BY_DIRECTION;
  ipi?: ORDER_BY_DIRECTION;
  receivedAt?: ORDER_BY_DIRECTION;
  fulfilledAt?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  item?: ItemOrderBy;
  order?: OrderOrderBy;
}

export interface OrderScheduleOrderBy {
  id?: ORDER_BY_DIRECTION;
  frequency?: ORDER_BY_DIRECTION;
  frequencyCount?: ORDER_BY_DIRECTION;
  isActive?: ORDER_BY_DIRECTION;
  nextRun?: ORDER_BY_DIRECTION;
  lastRun?: ORDER_BY_DIRECTION;
  finishedAt?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface OrderRuleOrderBy {
  id?: ORDER_BY_DIRECTION;
  isActive?: ORDER_BY_DIRECTION;
  priority?: ORDER_BY_DIRECTION;
  triggerType?: ORDER_BY_DIRECTION;
  consumptionDays?: ORDER_BY_DIRECTION;
  safetyStockDays?: ORDER_BY_DIRECTION;
  minOrderQuantity?: ORDER_BY_DIRECTION;
  maxOrderQuantity?: ORDER_BY_DIRECTION;
  orderMultiple?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  item?: ItemOrderBy;
  supplier?: SupplierOrderBy;
}

// =====================
// Response Interfaces
// =====================

// Order responses
export type OrderGetUniqueResponse = BaseGetUniqueResponse<Order>;
export type OrderGetManyResponse = BaseGetManyResponse<Order>;
export type OrderCreateResponse = BaseCreateResponse<Order>;
export type OrderUpdateResponse = BaseUpdateResponse<Order>;
export type OrderDeleteResponse = BaseDeleteResponse;

// OrderItem responses
export type OrderItemGetUniqueResponse = BaseGetUniqueResponse<OrderItem>;
export type OrderItemGetManyResponse = BaseGetManyResponse<OrderItem>;
export type OrderItemCreateResponse = BaseCreateResponse<OrderItem>;
export type OrderItemUpdateResponse = BaseUpdateResponse<OrderItem>;
export type OrderItemDeleteResponse = BaseDeleteResponse;

// OrderSchedule responses
export type OrderScheduleGetUniqueResponse = BaseGetUniqueResponse<OrderSchedule>;
export type OrderScheduleGetManyResponse = BaseGetManyResponse<OrderSchedule>;
export type OrderScheduleCreateResponse = BaseCreateResponse<OrderSchedule>;
export type OrderScheduleUpdateResponse = BaseUpdateResponse<OrderSchedule>;
export type OrderScheduleDeleteResponse = BaseDeleteResponse;

// OrderRule responses
export type OrderRuleGetUniqueResponse = BaseGetUniqueResponse<OrderRule>;
export type OrderRuleGetManyResponse = BaseGetManyResponse<OrderRule>;
export type OrderRuleCreateResponse = BaseCreateResponse<OrderRule>;
export type OrderRuleUpdateResponse = BaseUpdateResponse<OrderRule>;
export type OrderRuleDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// Order batch operations
export type OrderBatchCreateResponse<T> = BaseBatchResponse<Order, T>;
export type OrderBatchUpdateResponse<T> = BaseBatchResponse<Order, T & { id: string }>;
export type OrderBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// OrderItem batch operations
export type OrderItemBatchCreateResponse<T> = BaseBatchResponse<OrderItem, T>;
export type OrderItemBatchUpdateResponse<T> = BaseBatchResponse<OrderItem, T & { id: string }>;
export type OrderItemBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// OrderSchedule batch operations
export type OrderScheduleBatchCreateResponse<T> = BaseBatchResponse<OrderSchedule, T>;
export type OrderScheduleBatchUpdateResponse<T> = BaseBatchResponse<OrderSchedule, T & { id: string }>;
export type OrderScheduleBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// OrderRule batch operations
export type OrderRuleBatchCreateResponse<T> = BaseBatchResponse<OrderRule, T>;
export type OrderRuleBatchUpdateResponse<T> = BaseBatchResponse<OrderRule, T & { id: string }>;
export type OrderRuleBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
