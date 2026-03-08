// packages/hooks/src/hooks/useInvoice.ts

import { useQuery } from "@tanstack/react-query";
import { getInvoicesByTask, getInvoicesByCustomer, getInvoiceById } from '@/api-client';

// =====================================================
// Invoice Query Keys
// =====================================================

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => ["invoices", "list"] as const,
  byTask: (taskId: string) => ["invoices", "byTask", taskId] as const,
  byCustomer: (customerId: string) => ["invoices", "byCustomer", customerId] as const,
  details: () => ["invoices", "detail"] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

// ===============================================
// INVOICE HOOKS (Read-only)
// ===============================================

// -------------------------------------
// BY TASK
// -------------------------------------
export function useInvoicesByTask(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceKeys.byTask(taskId),
    queryFn: () => getInvoicesByTask(taskId),
    enabled: (options?.enabled ?? true) && !!taskId,
  });
}

// -------------------------------------
// BY CUSTOMER
// -------------------------------------
export function useInvoicesByCustomer(customerId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceKeys.byCustomer(customerId),
    queryFn: () => getInvoicesByCustomer(customerId),
    enabled: (options?.enabled ?? true) && !!customerId,
  });
}

// -------------------------------------
// SINGLE INVOICE
// -------------------------------------
export function useInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    enabled: (options?.enabled ?? true) && !!id,
  });
}
