// packages/hooks/src/hooks/useInvoice.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvoicesByTask,
  getInvoicesByCustomer,
  getInvoiceById,
  cancelInvoice,
  regenerateBoleto,
  cancelBoleto,
  emitNfse,
  cancelNfse,
  changeBankSlipDueDate,
  markBoletoPaid,
  updateInstallmentReceipts,
} from '@/api-client';

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
// INVOICE HOOKS - Queries
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

// ===============================================
// INVOICE HOOKS - Mutations
// ===============================================

// -------------------------------------
// CANCEL INVOICE
// -------------------------------------
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) =>
      cancelInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// REGENERATE BOLETO
// -------------------------------------
export function useRegenerateBoleto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installmentId, newDueDate }: { installmentId: string; newDueDate?: string }) =>
      regenerateBoleto(installmentId, newDueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// CANCEL BOLETO
// -------------------------------------
export function useCancelBoleto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installmentId, data }: { installmentId: string; data?: any }) =>
      cancelBoleto(installmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// EMIT NFS-e
// -------------------------------------
export function useEmitNfse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) =>
      emitNfse(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// CANCEL NFS-e
// -------------------------------------
export function useCancelNfse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, nfseDocumentId, data }: { invoiceId: string; nfseDocumentId: string; data: { reason: string; reasonCode?: number } }) =>
      cancelNfse(invoiceId, nfseDocumentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// CHANGE BANK SLIP DUE DATE
// -------------------------------------
export function useChangeBankSlipDueDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installmentId, newDueDate }: { installmentId: string; newDueDate: string }) =>
      changeBankSlipDueDate(installmentId, newDueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// MARK BOLETO AS PAID
// -------------------------------------
export function useMarkBoletoPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installmentId, paymentMethod, receiptFileIds, observations }: {
      installmentId: string;
      paymentMethod: string;
      receiptFileIds?: string[];
      observations?: string | null;
    }) => markBoletoPaid(installmentId, { paymentMethod, receiptFileIds, observations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// -------------------------------------
// UPDATE INSTALLMENT RECEIPTS
// -------------------------------------
export function useUpdateInstallmentReceipts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installmentId, receiptFileIds, observations }: {
      installmentId: string;
      receiptFileIds?: string[];
      observations?: string | null;
    }) => updateInstallmentReceipts(installmentId, { receiptFileIds, observations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}
