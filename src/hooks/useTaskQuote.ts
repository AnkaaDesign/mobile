// Task Quote Hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskQuoteService } from "@/api-client/task-quote";
import type { TaskQuote, TASK_QUOTE_STATUS } from "@/types/task-quote";
import { taskKeys } from "./queryKeys";

// =====================
// Query Keys
// =====================

export const taskQuoteKeys = {
  all: ["task-quotes"] as const,
  lists: () => [...taskQuoteKeys.all, "list"] as const,
  list: (filters?: any) => [...taskQuoteKeys.lists(), filters] as const,
  details: () => [...taskQuoteKeys.all, "detail"] as const,
  detail: (id: string) => [...taskQuoteKeys.details(), id] as const,
  byTask: (taskId: string) => [...taskQuoteKeys.all, "byTask", taskId] as const,
  expired: () => [...taskQuoteKeys.all, "expired"] as const,
};

// =====================
// Query Hooks
// =====================

/**
 * Get all quotes with optional filters
 */
export function useTaskQuotes(params?: { taskId?: string; status?: TASK_QUOTE_STATUS; limit?: number }) {
  return useQuery({
    queryKey: taskQuoteKeys.list(params),
    queryFn: () => taskQuoteService.getAll(params),
  });
}

/**
 * Get quote by ID
 */
export function useTaskQuote(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskQuoteKeys.detail(id),
    queryFn: () => taskQuoteService.getById(id),
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Get quote by task ID
 */
export function useTaskQuoteByTask(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskQuoteKeys.byTask(taskId),
    queryFn: () => taskQuoteService.getByTaskId(taskId),
    enabled: options?.enabled !== false && !!taskId,
  });
}

/**
 * Get expired quotes
 */
export function useExpiredTaskQuotes() {
  return useQuery({
    queryKey: taskQuoteKeys.expired(),
    queryFn: () => taskQuoteService.getExpired(),
  });
}

// =====================
// Mutation Hooks
// =====================

/**
 * Create quote mutation
 */
export function useCreateTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TaskQuote>) => taskQuoteService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Update quote mutation
 */
export function useUpdateTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskQuote> }) =>
      taskQuoteService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Delete quote mutation
 */
export function useDeleteTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQuoteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Approve quote mutation
 */
export function useApproveTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQuoteService.approve(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Reject quote mutation
 */
export function useRejectTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      taskQuoteService.reject(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Cancel quote mutation
 */
export function useCancelTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQuoteService.cancel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Budget approve quote mutation (PENDING -> BUDGET_APPROVED)
 */
export function useBudgetApproveTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQuoteService.budgetApprove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Verify quote mutation (BUDGET_APPROVED -> VERIFIED_BY_FINANCIAL)
 */
export function useVerifyTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQuoteService.verify(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Internal approve quote mutation (VERIFIED_BY_FINANCIAL -> BILLING_APPROVED, triggers invoice generation)
 */
export function useInternalApproveTaskQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQuoteService.internalApprove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Update quote status mutation
 */
export function useUpdateTaskQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: TASK_QUOTE_STATUS; reason?: string }) =>
      taskQuoteService.updateStatus(id, status, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
