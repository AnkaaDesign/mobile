// packages/api/src/invoice.ts

import { apiClient } from "./axiosClient";
import type { Invoice } from '../types';

// =====================
// Invoice Service Class
// =====================

export class InvoiceService {
  private readonly basePath = "/invoices";

  // =====================
  // Query Operations
  // =====================

  async getMany(params?: Record<string, any>): Promise<{ data: Invoice[]; meta: any }> {
    const response = await apiClient.get<{ data: Invoice[]; meta: any }>(this.basePath, {
      params: {
        ...params,
        include: params?.include ?? {
          customer: true,
          task: true,
        },
      },
    });
    return response.data;
  }

  async getByTaskId(taskId: string): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>(`${this.basePath}/task/${taskId}`, {
      params: {
        include: {
          installments: { include: { bankSlip: { include: { pdfFile: true } } } },
          nfseDocuments: true,
          customer: true,
        },
      },
    });
    return response.data;
  }

  async getByCustomerId(customerId: string): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>(`${this.basePath}/customer/${customerId}`);
    return response.data;
  }

  async getById(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`${this.basePath}/${id}`, {
      params: {
        include: {
          installments: { include: { bankSlip: { include: { pdfFile: true } } } },
          nfseDocuments: true,
          customer: true,
          task: true,
        },
      },
    });
    return response.data;
  }

  async getBoletoPdf(installmentId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/${installmentId}/boleto/pdf`, {
      responseType: "blob",
    });
    return response.data;
  }

  async getNfsePdf(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/${invoiceId}/nfse/pdf`, {
      responseType: "blob",
    });
    return response.data;
  }

  // =====================
  // Mutation Operations
  // =====================

  async cancel(id: string, data?: any): Promise<Invoice> {
    const response = await apiClient.put<Invoice>(`${this.basePath}/${id}/cancel`, data);
    return response.data;
  }

  async regenerateBoleto(installmentId: string, newDueDate?: string): Promise<any> {
    const response = await apiClient.post(`${this.basePath}/${installmentId}/boleto/regenerate`, newDueDate ? { newDueDate } : {});
    return response.data;
  }

  async cancelBoleto(installmentId: string, data?: any): Promise<any> {
    const response = await apiClient.put(`${this.basePath}/${installmentId}/boleto/cancel`, data);
    return response.data;
  }

  async emitNfse(invoiceId: string): Promise<any> {
    const response = await apiClient.post(`${this.basePath}/${invoiceId}/nfse/emit`);
    return response.data;
  }

  async cancelNfse(invoiceId: string, nfseDocumentId: string, data: { reason: string; reasonCode?: number }): Promise<any> {
    const response = await apiClient.put(`${this.basePath}/${invoiceId}/nfse/cancel`, { ...data, nfseDocumentId });
    return response.data;
  }

  async changeBankSlipDueDate(installmentId: string, newDueDate: string): Promise<any> {
    const response = await apiClient.put(`${this.basePath}/${installmentId}/boleto/due-date`, { newDueDate });
    return response.data;
  }

  async markBoletoPaid(installmentId: string, data: { paymentMethod: string; receiptFileId?: string }): Promise<any> {
    const response = await apiClient.put(`${this.basePath}/${installmentId}/boleto/mark-paid`, data);
    return response.data;
  }

  async updateInstallmentReceipt(installmentId: string, receiptFileId: string): Promise<any> {
    const response = await apiClient.put(`${this.basePath}/${installmentId}/receipt`, { receiptFileId });
    return response.data;
  }
}

// =====================
// Singleton Instance
// =====================

export const invoiceService = new InvoiceService();

// =====================
// Convenience Functions
// =====================

export const getInvoices = (params?: Record<string, any>) => invoiceService.getMany(params);
export const getInvoicesByTask = (taskId: string) => invoiceService.getByTaskId(taskId);
export const getInvoicesByCustomer = (customerId: string) => invoiceService.getByCustomerId(customerId);
export const getInvoiceById = (id: string) => invoiceService.getById(id);
export const getBoletoPdf = (installmentId: string) => invoiceService.getBoletoPdf(installmentId);
export const getNfsePdf = (invoiceId: string) => invoiceService.getNfsePdf(invoiceId);
export const cancelInvoice = (id: string, data?: any) => invoiceService.cancel(id, data);
export const regenerateBoleto = (installmentId: string, newDueDate?: string) => invoiceService.regenerateBoleto(installmentId, newDueDate);
export const cancelBoleto = (installmentId: string, data?: any) => invoiceService.cancelBoleto(installmentId, data);
export const emitNfse = (invoiceId: string) => invoiceService.emitNfse(invoiceId);
export const cancelNfse = (invoiceId: string, nfseDocumentId: string, data: { reason: string; reasonCode?: number }) => invoiceService.cancelNfse(invoiceId, nfseDocumentId, data);
export const changeBankSlipDueDate = (installmentId: string, newDueDate: string) => invoiceService.changeBankSlipDueDate(installmentId, newDueDate);
export const markBoletoPaid = (installmentId: string, data: { paymentMethod: string; receiptFileId?: string }) => invoiceService.markBoletoPaid(installmentId, data);
export const updateInstallmentReceipt = (installmentId: string, receiptFileId: string) => invoiceService.updateInstallmentReceipt(installmentId, receiptFileId);
