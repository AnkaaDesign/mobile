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

  async getByTaskId(taskId: string): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>(`${this.basePath}/task/${taskId}`);
    return response.data;
  }

  async getByCustomerId(customerId: string): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>(`${this.basePath}/customer/${customerId}`);
    return response.data;
  }

  async getById(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`${this.basePath}/${id}`);
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

  async regenerateBoleto(installmentId: string): Promise<any> {
    const response = await apiClient.post(`${this.basePath}/${installmentId}/boleto/regenerate`);
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

  async cancelNfse(invoiceId: string, nfseDocumentId: string, data: { reason: string }): Promise<any> {
    const response = await apiClient.put(`${this.basePath}/${invoiceId}/nfse/${nfseDocumentId}/cancel`, data);
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

export const getInvoicesByTask = (taskId: string) => invoiceService.getByTaskId(taskId);
export const getInvoicesByCustomer = (customerId: string) => invoiceService.getByCustomerId(customerId);
export const getInvoiceById = (id: string) => invoiceService.getById(id);
export const getBoletoPdf = (installmentId: string) => invoiceService.getBoletoPdf(installmentId);
export const getNfsePdf = (invoiceId: string) => invoiceService.getNfsePdf(invoiceId);
export const cancelInvoice = (id: string, data?: any) => invoiceService.cancel(id, data);
export const regenerateBoleto = (installmentId: string) => invoiceService.regenerateBoleto(installmentId);
export const cancelBoleto = (installmentId: string, data?: any) => invoiceService.cancelBoleto(installmentId, data);
export const emitNfse = (invoiceId: string) => invoiceService.emitNfse(invoiceId);
export const cancelNfse = (invoiceId: string, nfseDocumentId: string, data: { reason: string }) => invoiceService.cancelNfse(invoiceId, nfseDocumentId, data);
