// packages/api/src/invoice.ts

import { apiClient } from "./axiosClient";
import type { Invoice } from '../types';

// =====================
// Invoice Service Class (Read-only)
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
