// Task Pricing Hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskPricingService } from "@/api-client/task-pricing";
import type { TaskPricing, TASK_PRICING_STATUS } from "@/types/task-pricing";
import { taskKeys } from "./queryKeys";

// =====================
// Query Keys
// =====================

export const taskPricingKeys = {
  all: ["task-pricings"] as const,
  lists: () => [...taskPricingKeys.all, "list"] as const,
  list: (filters?: any) => [...taskPricingKeys.lists(), filters] as const,
  details: () => [...taskPricingKeys.all, "detail"] as const,
  detail: (id: string) => [...taskPricingKeys.details(), id] as const,
  byTask: (taskId: string) => [...taskPricingKeys.all, "byTask", taskId] as const,
  expired: () => [...taskPricingKeys.all, "expired"] as const,
};

// =====================
// Query Hooks
// =====================

/**
 * Get all pricings with optional filters
 */
export function useTaskPricings(params?: { taskId?: string; status?: TASK_PRICING_STATUS; limit?: number }) {
  return useQuery({
    queryKey: taskPricingKeys.list(params),
    queryFn: () => taskPricingService.getAll(params),
  });
}

/**
 * Get pricing by ID
 */
export function useTaskPricing(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskPricingKeys.detail(id),
    queryFn: () => taskPricingService.getById(id),
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Get pricing by task ID
 */
export function useTaskPricingByTask(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskPricingKeys.byTask(taskId),
    queryFn: () => taskPricingService.getByTaskId(taskId),
    enabled: options?.enabled !== false && !!taskId,
  });
}

/**
 * Get expired pricings
 */
export function useExpiredTaskPricings() {
  return useQuery({
    queryKey: taskPricingKeys.expired(),
    queryFn: () => taskPricingService.getExpired(),
  });
}

// =====================
// Mutation Hooks
// =====================

/**
 * Create pricing mutation
 */
export function useCreateTaskPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TaskPricing>) => taskPricingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Update pricing mutation
 */
export function useUpdateTaskPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskPricing> }) =>
      taskPricingService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Delete pricing mutation
 */
export function useDeleteTaskPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskPricingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Approve pricing mutation
 */
export function useApproveTaskPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskPricingService.approve(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Reject pricing mutation
 */
export function useRejectTaskPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      taskPricingService.reject(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Cancel pricing mutation
 */
export function useCancelTaskPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskPricingService.cancel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Update pricing status mutation
 */
export function useUpdateTaskPricingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: TASK_PRICING_STATUS; reason?: string }) =>
      taskPricingService.updateStatus(id, status, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskPricingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
