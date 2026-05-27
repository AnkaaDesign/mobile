// packages/hooks/src/useOrderSchedule.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrderSchedules,
  getOrderSchedule,
  createOrderSchedule,
  updateOrderSchedule,
  deleteOrderSchedule,
  batchCreateOrderSchedules,
  batchUpdateOrderSchedules,
  batchDeleteOrderSchedules,
  getOrderScheduleProjection,
  triggerOrderSchedule,
  getOrderScheduleExpectedTotals,
} from '@/api-client';
import type {
  OrderScheduleGetManyFormData,
  OrderScheduleCreateFormData,
  OrderScheduleUpdateFormData,
  OrderScheduleBatchCreateFormData,
  OrderScheduleBatchUpdateFormData,
  OrderScheduleBatchDeleteFormData,
  OrderScheduleTriggerFormData,
} from '@/schemas';
import type {
  OrderScheduleGetManyResponse,
  OrderScheduleGetUniqueResponse,
  OrderScheduleCreateResponse,
  OrderScheduleUpdateResponse,
  OrderScheduleDeleteResponse,
  OrderScheduleBatchCreateResponse,
  OrderScheduleBatchUpdateResponse,
  OrderScheduleBatchDeleteResponse,
  OrderScheduleProjectionResponse,
  OrderScheduleTriggerResponse,
  OrderScheduleExpectedTotalsResponse,
} from '@/types';
import { orderScheduleKeys, orderKeys, supplierKeys } from "./queryKeys";
import { createEntityHooks, createSpecializedQueryHook } from "./createEntityHooks";

// =====================================================
// OrderSchedule Service Adapter
// =====================================================

const orderScheduleService = {
  getMany: getOrderSchedules,
  getById: getOrderSchedule,
  create: createOrderSchedule,
  update: updateOrderSchedule,
  delete: deleteOrderSchedule,
  batchCreate: batchCreateOrderSchedules,
  batchUpdate: batchUpdateOrderSchedules,
  batchDelete: batchDeleteOrderSchedules,
};

// =====================================================
// Base OrderSchedule Hooks
// =====================================================

const baseOrderScheduleHooks = createEntityHooks<
  OrderScheduleGetManyFormData,
  OrderScheduleGetManyResponse,
  OrderScheduleGetUniqueResponse,
  OrderScheduleCreateFormData,
  OrderScheduleCreateResponse,
  OrderScheduleUpdateFormData,
  OrderScheduleUpdateResponse,
  OrderScheduleDeleteResponse,
  OrderScheduleBatchCreateFormData,
  OrderScheduleBatchCreateResponse<OrderScheduleCreateFormData>,
  OrderScheduleBatchUpdateFormData,
  OrderScheduleBatchUpdateResponse<OrderScheduleUpdateFormData>,
  OrderScheduleBatchDeleteFormData,
  OrderScheduleBatchDeleteResponse
>({
  queryKeys: orderScheduleKeys,
  service: orderScheduleService,
  staleTime: 1000 * 60 * 10, // 10 minutes - schedules don't change often
  relatedQueryKeys: [orderKeys, supplierKeys], // Order schedules affect orders and suppliers
});

// Export base hooks with standard names
export const useOrderSchedulesInfinite = baseOrderScheduleHooks.useInfiniteList;
export const useOrderSchedules = baseOrderScheduleHooks.useList;
export const useOrderSchedule = baseOrderScheduleHooks.useDetail;

// =====================================================
// Specialized OrderSchedule Query Hooks
// =====================================================

// Active order schedules
export const useActiveOrderSchedules = createSpecializedQueryHook<Partial<OrderScheduleGetManyFormData>, OrderScheduleGetManyResponse>({
  queryKeyFn: (filters) => orderScheduleKeys.active(filters),
  queryFn: (filters) => getOrderSchedules({ ...filters, isActive: true }),
  staleTime: 1000 * 60 * 10, // 10 minutes
});

// =====================================================
// OrderSchedule Projection (auto-creation preview)
// =====================================================

// Fetches the per-item projection (quantities/totals for "today" vs the
// scheduled date) plus meta (gap, interval, coverage, scheduled date).
export const useOrderScheduleProjection = (id: string, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useQuery<OrderScheduleProjectionResponse>({
    queryKey: orderScheduleKeys.projection(id),
    queryFn: () => getOrderScheduleProjection(id),
    staleTime: 1000 * 60 * 2, // 2 minutes - projections are time-sensitive
    enabled: enabled && !!id,
  });
};

// =====================================================
// OrderSchedule Expected Totals (batch list projection)
// =====================================================

// Batch-fetches the projected total order cost ("expected total") for a set of
// schedules when they next fire. Used by the schedule list to show a "Preço
// esperado" per row from ONE request covering all visible ids. The query key
// includes the sorted ids so identical id sets share a cache entry.
export const useOrderScheduleExpectedTotals = (scheduleIds: string[]) => {
  const sortedIds = [...scheduleIds].sort();

  return useQuery<OrderScheduleExpectedTotalsResponse>({
    queryKey: orderScheduleKeys.expectedTotals(sortedIds),
    queryFn: () => getOrderScheduleExpectedTotals(sortedIds),
    staleTime: 1000 * 60 * 2, // 2 minutes - projections are time-sensitive
    enabled: sortedIds.length > 0,
  });
};

// =====================================================
// Custom OrderSchedule Mutations with Enhanced Invalidation
// =====================================================

export const useOrderScheduleMutations = (options?: {
  onCreateSuccess?: (data: OrderScheduleCreateResponse, variables: OrderScheduleCreateFormData) => void;
  onUpdateSuccess?: (data: OrderScheduleUpdateResponse, variables: { id: string; data: OrderScheduleUpdateFormData }) => void;
  onDeleteSuccess?: (data: OrderScheduleDeleteResponse, variables: string) => void;
}) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    // Invalidate order schedule queries
    queryClient.invalidateQueries({
      queryKey: orderScheduleKeys.all,
    });

    // Invalidate active schedules
    queryClient.invalidateQueries({
      queryKey: orderScheduleKeys.active(),
    });

    // Invalidate order queries
    queryClient.invalidateQueries({
      queryKey: orderKeys.all,
    });
  };

  // CREATE
  const createMutation = useMutation({
    mutationFn: (data: OrderScheduleCreateFormData) => createOrderSchedule(data),
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onCreateSuccess?.(data, variables);
    },
  });

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderScheduleUpdateFormData }) => updateOrderSchedule(id, data),
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onUpdateSuccess?.(data, variables);
    },
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrderSchedule(id),
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onDeleteSuccess?.(data, variables);
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const error = createMutation.error || updateMutation.error || deleteMutation.error;

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isLoading,
    error,
    refresh: () => invalidateQueries(),
    // Individual mutation states
    createMutation,
    updateMutation,
    deleteMutation,
  };
};

// =====================================================
// OrderSchedule Manual Trigger (auto-creation)
// =====================================================

// Triggers a schedule manually with a cascade strategy (GAP_ONLY / GAP_PLUS_CYCLE).
// Invalidates schedule detail/list, projection and order keys on success so the
// freshly created order and advanced nextRun are reflected immediately.
export const useTriggerOrderSchedule = (options?: {
  onSuccess?: (data: OrderScheduleTriggerResponse, variables: { id: string; cascadeMode: OrderScheduleTriggerFormData["cascadeMode"] }) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cascadeMode }: { id: string; cascadeMode: OrderScheduleTriggerFormData["cascadeMode"] }) =>
      triggerOrderSchedule(id, { cascadeMode }),
    onSuccess: (data, variables) => {
      // Order schedule queries (detail + list + active)
      queryClient.invalidateQueries({ queryKey: orderScheduleKeys.all });
      queryClient.invalidateQueries({ queryKey: orderScheduleKeys.active() });
      // Projection for this schedule
      queryClient.invalidateQueries({ queryKey: orderScheduleKeys.projection(variables.id) });
      // Orders (a new order may have been created)
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      options?.onSuccess?.(data, variables);
    },
  });
};

export const useOrderScheduleBatchMutations = (options?: {
  onBatchCreateSuccess?: (data: OrderScheduleBatchCreateResponse<OrderScheduleCreateFormData>, variables: OrderScheduleBatchCreateFormData) => void;
  onBatchUpdateSuccess?: (data: OrderScheduleBatchUpdateResponse<OrderScheduleUpdateFormData>, variables: OrderScheduleBatchUpdateFormData) => void;
  onBatchDeleteSuccess?: (data: OrderScheduleBatchDeleteResponse, variables: OrderScheduleBatchDeleteFormData) => void;
}) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: orderScheduleKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: orderScheduleKeys.active(),
    });
    queryClient.invalidateQueries({
      queryKey: orderKeys.all,
    });
    queryClient.invalidateQueries({
      queryKey: supplierKeys.all,
    });
  };

  // BATCH CREATE
  const batchCreateMutation = useMutation({
    mutationFn: (data: OrderScheduleBatchCreateFormData) => batchCreateOrderSchedules(data),
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onBatchCreateSuccess?.(data, variables);
    },
  });

  // BATCH UPDATE
  const batchUpdateMutation = useMutation({
    mutationFn: (data: OrderScheduleBatchUpdateFormData) => batchUpdateOrderSchedules(data),
    onSuccess: (data, variables) => {
      invalidateQueries();
      options?.onBatchUpdateSuccess?.(data, variables);
    },
  });

  // BATCH DELETE
  const batchDeleteMutation = useMutation({
    mutationFn: batchDeleteOrderSchedules,
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

export const useCreateOrderSchedule = () => {
  const mutations = useOrderScheduleMutations();
  return {
    ...mutations.createMutation,
    mutate: mutations.create,
    mutateAsync: mutations.createAsync,
  };
};

export const useUpdateOrderSchedule = (id: string) => {
  const mutations = useOrderScheduleMutations();
  return {
    mutate: (data: OrderScheduleUpdateFormData) => mutations.update({ id, data }),
    mutateAsync: (data: OrderScheduleUpdateFormData) => mutations.updateAsync({ id, data }),
    isPending: mutations.updateMutation.isPending,
    isError: mutations.updateMutation.isError,
    error: mutations.updateMutation.error,
  };
};

export const useDeleteOrderSchedule = () => {
  const mutations = useOrderScheduleMutations();
  return {
    ...mutations.deleteMutation,
    mutate: mutations.delete,
    mutateAsync: mutations.deleteAsync,
  };
};
