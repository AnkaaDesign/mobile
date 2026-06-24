// packages/hooks/src/useOrder.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  batchCreateOrders,
  batchUpdateOrders,
  batchDeleteOrders,
  markOrderPaid,
  markInstallmentPaid,
  markOrderAwaitingPayment,
  getPayables,
  settlePayrollMonth,
} from '@/api-client';
import type {
  OrderGetManyFormData,
  OrderCreateFormData,
  OrderUpdateFormData,
  OrderBatchCreateFormData,
  OrderBatchUpdateFormData,
  OrderBatchDeleteFormData,
  OrderInclude,
} from '@/schemas';
import type {
  OrderGetManyResponse,
  OrderGetUniqueResponse,
  OrderCreateResponse,
  OrderUpdateResponse,
  OrderDeleteResponse,
  OrderBatchCreateResponse,
  OrderBatchUpdateResponse,
  OrderBatchDeleteResponse,
} from '@/types';
import { orderKeys, orderItemKeys, orderScheduleKeys, activityKeys, itemKeys, supplierKeys, changeLogKeys } from "./queryKeys";
import { ORDER_STATUS } from '@/constants';
import { createEntityHooks, createSpecializedQueryHook } from "./createEntityHooks";

// =====================================================
// Order Service Adapter
// =====================================================

const orderService = {
  getMany: (params?: OrderGetManyFormData) => getOrders(params || {}),
  getById: (id: string, params?: any) => getOrder(id, params),
  create: (data: OrderCreateFormData, include?: OrderInclude) => createOrder(data, include ? { include } : undefined),
  update: (id: string, data: OrderUpdateFormData, include?: OrderInclude) => updateOrder(id, data, include ? { include } : undefined),
  delete: (id: string) => deleteOrder(id),
  batchCreate: (data: OrderBatchCreateFormData, include?: OrderInclude) => batchCreateOrders(data, include ? { include } : undefined),
  batchUpdate: (data: OrderBatchUpdateFormData, include?: OrderInclude) => batchUpdateOrders(data, include ? { include } : undefined),
  batchDelete: (data: OrderBatchDeleteFormData) => batchDeleteOrders(data),
};

// =====================================================
// Base Order Hooks
// =====================================================

const baseOrderHooks = createEntityHooks<
  OrderGetManyFormData,
  OrderGetManyResponse,
  OrderGetUniqueResponse,
  OrderCreateFormData,
  OrderCreateResponse,
  OrderUpdateFormData,
  OrderUpdateResponse,
  OrderDeleteResponse,
  OrderBatchCreateFormData,
  OrderBatchCreateResponse<OrderCreateFormData>,
  OrderBatchUpdateFormData,
  OrderBatchUpdateResponse<OrderUpdateFormData>,
  OrderBatchDeleteFormData,
  OrderBatchDeleteResponse
>({
  queryKeys: orderKeys,
  service: orderService,
  staleTime: 1000 * 60 * 5, // 5 minutes
  relatedQueryKeys: [orderItemKeys, orderScheduleKeys, activityKeys, itemKeys, supplierKeys, changeLogKeys],
});

// Export base hooks with standard names
export const useOrdersInfinite = baseOrderHooks.useInfiniteList;
export const useOrders = baseOrderHooks.useList;
export const useOrder = baseOrderHooks.useDetail;

// =====================================================
// Specialized Order Query Hooks
// =====================================================

// Pending orders
export const usePendingOrders = createSpecializedQueryHook<Partial<OrderGetManyFormData>, OrderGetManyResponse>({
  queryKeyFn: (filters) => orderKeys.pending(filters),
  queryFn: (filters) => getOrders({ ...filters, status: [ORDER_STATUS.CREATED] }),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Completed orders
export const useCompletedOrders = createSpecializedQueryHook<Partial<OrderGetManyFormData>, OrderGetManyResponse>({
  queryKeyFn: (filters) => orderKeys.list({ ...filters, status: [ORDER_STATUS.RECEIVED] }),
  queryFn: (filters) => getOrders({ ...filters, status: [ORDER_STATUS.RECEIVED] }),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Orders by supplier
export const useOrdersBySupplier = createSpecializedQueryHook<{ supplierId: string; filters?: Partial<OrderGetManyFormData> }, OrderGetManyResponse>({
  queryKeyFn: ({ supplierId, filters }) => orderKeys.bySupplier(supplierId, filters),
  queryFn: ({ supplierId, filters }) => getOrders({ ...filters, supplierIds: [supplierId] }),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// =====================================================
// Custom Order Mutations with Enhanced Invalidation
// =====================================================

export const useOrderMutations = (options?: {
  onCreateSuccess?: (data: OrderCreateResponse, variables: OrderCreateFormData) => void;
  onUpdateSuccess?: (data: OrderUpdateResponse, variables: { id: string; data: OrderUpdateFormData }) => void;
  onDeleteSuccess?: (data: OrderDeleteResponse, variables: string) => void;
}) => {
  const queryClient = useQueryClient();

  const invalidateQueries = (supplierId?: string, orderScheduleId?: string) => {
    // Invalidate order queries
    queryClient.invalidateQueries({
      queryKey: orderKeys.all,
    });

    // Invalidate statistics
    queryClient.invalidateQueries({
      queryKey: orderKeys.statistics(),
    });

    // Invalidate pending orders
    queryClient.invalidateQueries({
      queryKey: orderKeys.pending(),
    });

    // Invalidate supplier-specific queries
    if (supplierId) {
      queryClient.invalidateQueries({
        queryKey: orderKeys.bySupplier(supplierId),
      });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(supplierId),
      });
    }

    // Invalidate order schedule
    if (orderScheduleId) {
      queryClient.invalidateQueries({
        queryKey: orderScheduleKeys.detail(orderScheduleId),
      });
    }

    // Invalidate related entities
    queryClient.invalidateQueries({
      queryKey: orderItemKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: activityKeys.all,
    });
  };

  // CREATE
  const createMutation = useMutation({
    mutationFn: (data: OrderCreateFormData) => createOrder(data),
    onSuccess: (data, variables) => {
      invalidateQueries(data.data?.supplierId || undefined, data.data?.orderScheduleId || undefined);
      options?.onCreateSuccess?.(data, variables);
    },
  });

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderUpdateFormData }) => updateOrder(id, data),
    onSuccess: (data, variables) => {
      invalidateQueries(data.data?.supplierId || undefined);

      // If order status changed to received, invalidate item quantities
      if (data.data?.status === ORDER_STATUS.RECEIVED) {
        queryClient.invalidateQueries({
          queryKey: itemKeys.all,
        });
        queryClient.invalidateQueries({
          queryKey: activityKeys.all,
        });
      }

      options?.onUpdateSuccess?.(data, variables);
    },
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onDeleteSuccess?.(data, variables);
    },
  });

  // MARK PAID (Contas a Pagar: Aguardando Pagamento → Pago)
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => markOrderPaid(id),
    onSuccess: (data) => {
      invalidateQueries(data.data?.supplierId || undefined);
      // Refresh the unified payables feed too.
      queryClient.invalidateQueries({ queryKey: orderKeys.payables() });
    },
  });

  // MARK AWAITING PAYMENT (undo: Pago → Aguardando Pagamento)
  const markAwaitingPaymentMutation = useMutation({
    mutationFn: (id: string) => markOrderAwaitingPayment(id),
    onSuccess: (data) => {
      invalidateQueries(data.data?.supplierId || undefined);
      queryClient.invalidateQueries({ queryKey: orderKeys.payables() });
    },
  });

  // MARK INSTALLMENT PAID (settle ONE boleto parcela — not the whole order). The
  // API endpoint closes only that Installment and re-rolls the order's payment
  // status (PARTIALLY_PAID/PAID); the full invalidate sweep refreshes the detail
  // card + order rollup.
  const markInstallmentPaidMutation = useMutation({
    mutationFn: (installmentId: string) => markInstallmentPaid(installmentId),
    onSuccess: (data) => {
      invalidateQueries(data.data?.supplierId || undefined);
      queryClient.invalidateQueries({ queryKey: orderKeys.payables() });
    },
  });

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    markPaidMutation.isPending ||
    markAwaitingPaymentMutation.isPending ||
    markInstallmentPaidMutation.isPending;

  const error =
    createMutation.error ||
    updateMutation.error ||
    deleteMutation.error ||
    markPaidMutation.error ||
    markAwaitingPaymentMutation.error ||
    markInstallmentPaidMutation.error;

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    markPaid: markPaidMutation.mutate,
    markPaidAsync: markPaidMutation.mutateAsync,
    markAwaitingPayment: markAwaitingPaymentMutation.mutate,
    markAwaitingPaymentAsync: markAwaitingPaymentMutation.mutateAsync,
    markInstallmentPaid: markInstallmentPaidMutation.mutate,
    markInstallmentPaidAsync: markInstallmentPaidMutation.mutateAsync,
    isLoading,
    error,
    refresh: () => invalidateQueries(),
    // Individual mutation states
    createMutation,
    updateMutation,
    deleteMutation,
    markPaidMutation,
    markAwaitingPaymentMutation,
    markInstallmentPaidMutation,
  };
};

// =====================================================
// Unified Payables (Contas a Pagar) Query Hook
// =====================================================

export const usePayables = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: orderKeys.payables(),
    queryFn: () => getPayables(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
};

/**
 * Mutations the Contas a Pagar list invokes to settle a payable row in place.
 *
 * - `markPaid` settles an ORDER row (mirrors the order detail mark-paid).
 * - `settlePayrollMonth` settles a PAYROLL competence batch (folha) via the
 *   unified /financial/payables/settle facade.
 *
 * Reconciliation / OFX (Axis B) stays web-only; this is the Axis-A assertion.
 */
export const usePayableMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.payables() });
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  };

  const markPaidMutation = useMutation({
    mutationFn: (orderId: string) => markOrderPaid(orderId),
    onSuccess: invalidate,
  });

  // Settles a single boleto installment (one parcela) — not the whole order.
  const markInstallmentPaidMutation = useMutation({
    mutationFn: (installmentId: string) => markInstallmentPaid(installmentId),
    onSuccess: invalidate,
  });

  const settlePayrollMutation = useMutation({
    mutationFn: (vars: { year: number; month: number; amount: number | null }) =>
      settlePayrollMonth(vars.year, vars.month, vars.amount),
    onSuccess: invalidate,
  });

  return { markPaidMutation, markInstallmentPaidMutation, settlePayrollMutation };
};

export const useOrderBatchMutations = (options?: {
  onBatchCreateSuccess?: (data: OrderBatchCreateResponse<OrderCreateFormData>, variables: OrderBatchCreateFormData) => void;
  onBatchUpdateSuccess?: (data: OrderBatchUpdateResponse<OrderUpdateFormData>, variables: OrderBatchUpdateFormData) => void;
  onBatchDeleteSuccess?: (data: OrderBatchDeleteResponse, variables: OrderBatchDeleteFormData) => void;
}) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: orderKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: orderKeys.statistics(),
    });
    queryClient.invalidateQueries({
      queryKey: orderKeys.pending(),
    });
    queryClient.invalidateQueries({
      queryKey: orderItemKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: activityKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: itemKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: supplierKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: orderScheduleKeys.all,
    });
  };

  // BATCH CREATE
  const batchCreateMutation = useMutation({
    mutationFn: (data: OrderBatchCreateFormData) => batchCreateOrders(data),
    onSuccess: (response, variables) => {
      invalidateQueries();

      // Invalidate specific supplier and schedule queries
      if (response.data?.success) {
        const supplierIds = new Set(response.data.success.map((order) => order.supplierId).filter((id): id is string => !!id));
        const scheduleIds = new Set(response.data.success.map((order) => order.orderScheduleId).filter((id): id is string => !!id));

        supplierIds.forEach((supplierId) => {
          queryClient.invalidateQueries({
            queryKey: orderKeys.bySupplier(supplierId),
          });
        });

        scheduleIds.forEach((scheduleId) => {
          queryClient.invalidateQueries({
            queryKey: orderScheduleKeys.detail(scheduleId),
          });
        });
      }

      options?.onBatchCreateSuccess?.(response, variables);
    },
  });

  // BATCH UPDATE
  const batchUpdateMutation = useMutation({
    mutationFn: (data: OrderBatchUpdateFormData) => batchUpdateOrders(data),
    onSuccess: (response, variables) => {
      invalidateQueries();

      // Check for received orders and invalidate accordingly
      if (response.data?.success) {
        const receivedOrders = response.data.success.filter((order) => order.status === ORDER_STATUS.RECEIVED);
        if (receivedOrders.length > 0) {
          queryClient.invalidateQueries({
            queryKey: itemKeys.all,
          });
        }
      }

      options?.onBatchUpdateSuccess?.(response, variables);
    },
  });

  // BATCH DELETE
  const batchDeleteMutation = useMutation({
    mutationFn: batchDeleteOrders,
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onBatchDeleteSuccess?.(data, variables);
    },
  });

  const isLoading = batchCreateMutation.isPending || batchUpdateMutation.isPending || batchDeleteMutation.isPending;

  const error = batchCreateMutation.error || batchUpdateMutation.error || batchDeleteMutation.error;

  return {
    batchCreate: batchCreateMutation.mutate,
    batchCreateAsync: batchCreateMutation.mutateAsync,
    batchUpdate: batchUpdateMutation.mutate,
    batchUpdateAsync: batchUpdateMutation.mutateAsync,
    batchDelete: batchDeleteMutation.mutate,
    batchDeleteAsync: batchDeleteMutation.mutateAsync,
    isLoading,
    error,
    refresh: invalidateQueries,
    // Individual mutation states
    batchCreateMutation,
    batchUpdateMutation,
    batchDeleteMutation,
  };
};

// =====================================================
// Backward Compatibility Exports
// =====================================================

export const useCreateOrder = () => {
  const mutations = useOrderMutations();
  return {
    ...mutations.createMutation,
    mutate: mutations.create,
    mutateAsync: mutations.createAsync,
  };
};

export const useUpdateOrder = (id: string) => {
  const mutations = useOrderMutations();
  return {
    mutate: (data: OrderUpdateFormData) => mutations.update({ id, data }),
    mutateAsync: (data: OrderUpdateFormData) => mutations.updateAsync({ id, data }),
    isPending: mutations.updateMutation.isPending,
    isError: mutations.updateMutation.isError,
    error: mutations.updateMutation.error,
  };
};

export const useDeleteOrder = () => {
  const mutations = useOrderMutations();
  return {
    ...mutations.deleteMutation,
    mutate: mutations.delete,
    mutateAsync: mutations.deleteAsync,
  };
};

export const useBatchCreateOrders = () => {
  const mutations = useOrderBatchMutations();
  return {
    ...mutations.batchCreateMutation,
    mutate: mutations.batchCreate,
    mutateAsync: mutations.batchCreateAsync,
  };
};

export const useBatchUpdateOrders = () => {
  const mutations = useOrderBatchMutations();
  return {
    ...mutations.batchUpdateMutation,
    mutate: mutations.batchUpdate,
    mutateAsync: mutations.batchUpdateAsync,
  };
};

export const useBatchDeleteOrders = () => {
  const mutations = useOrderBatchMutations();
  return {
    ...mutations.batchDeleteMutation,
    mutate: mutations.batchDelete,
    mutateAsync: mutations.batchDeleteAsync,
  };
};

// Re-export OrderItem and OrderSchedule hooks for backward compatibility
export {
  // OrderItem hooks
  useOrderItems,
  useOrderItem,
  useOrderItemsByOrder,
  useCreateOrderItem,
  useUpdateOrderItem,
  useDeleteOrderItem,
} from "./useOrderItem";

export {
  // OrderSchedule hooks
  useOrderSchedules,
  useOrderSchedule,
  useActiveOrderSchedules,
  useCreateOrderSchedule,
  useUpdateOrderSchedule,
  useDeleteOrderSchedule,
} from "./useOrderSchedule";
