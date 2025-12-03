// packages/types/src/activity.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ACTIVITY_OPERATION, ACTIVITY_REASON, ORDER_BY_DIRECTION } from '@/constants';
import type { Item, ItemIncludes, ItemOrderBy } from "./item";
import type { User, UserIncludes, UserOrderBy } from "./user";
import type { Order, OrderIncludes, OrderOrderBy, OrderItem, OrderItemIncludes, OrderItemOrderBy } from "./order";

// =====================
// Main Entity Interface
// =====================

export interface Activity extends BaseEntity {
  quantity: number;
  operation: ACTIVITY_OPERATION;
  userId: string | null;
  itemId: string;
  orderId: string | null;
  orderItemId: string | null;
  reason: ACTIVITY_REASON;
  reasonOrder: number | null; // 1=Pedido Recebido, 2=Uso em Produção, 3=Entrega de PPE, 4=Empréstimo, 5=Devolução, 6=Retirada Externa, 7=Retorno de Retirada Externa, 8=Contagem de Inventário, 9=Ajuste Manual, 10=Manutenção, 11=Dano, 12=Perda, 13=Produção de Tinta, 14=Outro

  // Relations
  item?: Item;
  user?: User;
  order?: Order;
  orderItem?: OrderItem;
}

// =====================
// Include Types
// =====================

export interface ActivityIncludes {
  item?:
    | boolean
    | {
        include?: ItemIncludes;
      };
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
  order?:
    | boolean
    | {
        include?: OrderIncludes;
      };
  orderItem?:
    | boolean
    | {
        include?: OrderItemIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface ActivityOrderBy {
  id?: ORDER_BY_DIRECTION;
  quantity?: ORDER_BY_DIRECTION;
  operation?: ORDER_BY_DIRECTION;
  reason?: ORDER_BY_DIRECTION;
  reasonOrder?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  item?: ItemOrderBy;
  user?: UserOrderBy;
  order?: OrderOrderBy;
  orderItem?: OrderItemOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type ActivityGetUniqueResponse = BaseGetUniqueResponse<Activity>;
export type ActivityGetManyResponse = BaseGetManyResponse<Activity>;
export type ActivityCreateResponse = BaseCreateResponse<Activity>;
export type ActivityUpdateResponse = BaseUpdateResponse<Activity>;
export type ActivityDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type ActivityBatchCreateResponse<T = any> = BaseBatchResponse<Activity, T>;
export type ActivityBatchUpdateResponse<T = any> = BaseBatchResponse<Activity, T & { id: string }>;
export type ActivityBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
