// Task Quote API Client

import { apiClient } from "./axiosClient";
import type { TaskQuote, TASK_QUOTE_STATUS } from "../types/task-quote";

// =====================
// Response Types
// =====================

export interface TaskQuoteResponse {
  success: boolean;
  data: TaskQuote;
  message?: string;
}

export interface TaskQuoteListResponse {
  success: boolean;
  data: TaskQuote[];
  message?: string;
  total?: number;
}

export interface TaskQuoteGetManyParams {
  taskId?: string;
  status?: TASK_QUOTE_STATUS;
  limit?: number;
  offset?: number;
}

// =====================
// TaskQuote Class
// =====================

export class TaskQuoteService {
  private readonly basePath = "/task-quotes";

  // =====================
  // Query Operations
  // =====================

  async getAll(params?: TaskQuoteGetManyParams): Promise<TaskQuoteListResponse> {
    const response = await apiClient.get<TaskQuoteListResponse>(this.basePath, { params });
    return response.data;
  }

  async getById(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.get<TaskQuoteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  async getByTaskId(taskId: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.get<TaskQuoteResponse>(`${this.basePath}/task/${taskId}`);
    return response.data;
  }

  // =====================
  // CRUD Operations
  // =====================

  async create(data: Partial<TaskQuote>): Promise<TaskQuoteResponse> {
    const response = await apiClient.post<TaskQuoteResponse>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: Partial<TaskQuote>): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`${this.basePath}/${id}`);
    return response.data;
  }

  // =====================
  // Status Operations
  // =====================

  async updateStatus(id: string, status: TASK_QUOTE_STATUS, reason?: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/status`, { status, reason });
    return response.data;
  }

  async approve(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/budget-approve`);
    return response.data;
  }

  async budgetApprove(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/budget-approve`);
    return response.data;
  }

  async commercialApprove(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/commercial-approve`);
    return response.data;
  }

  async internalApprove(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/internal-approve`);
    return response.data;
  }

  async reject(id: string, reason?: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/status`, { status: 'PENDING', reason });
    return response.data;
  }

  async cancel(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.put<TaskQuoteResponse>(`${this.basePath}/${id}/status`, { status: 'PENDING' });
    return response.data;
  }

  // =====================
  // Utility Operations
  // =====================

  async getExpired(): Promise<TaskQuoteListResponse> {
    const response = await apiClient.get<TaskQuoteListResponse>(`${this.basePath}/expired/list`);
    return response.data;
  }

  // =====================
  // Public Endpoints (No Auth Required)
  // =====================

  async getPublic(id: string): Promise<TaskQuoteResponse> {
    const response = await apiClient.get<TaskQuoteResponse>(`${this.basePath}/public/${id}`);
    return response.data;
  }
}

// =====================
// Service Instance & Exports
// =====================

export const taskQuoteService = new TaskQuoteService();

// TaskQuote exports
export const getTaskQuotes = (params?: TaskQuoteGetManyParams) => taskQuoteService.getAll(params);
export const getTaskQuoteById = (id: string) => taskQuoteService.getById(id);
export const getTaskQuoteByTaskId = (taskId: string) => taskQuoteService.getByTaskId(taskId);
export const createTaskQuote = (data: Partial<TaskQuote>) => taskQuoteService.create(data);
export const updateTaskQuote = (id: string, data: Partial<TaskQuote>) => taskQuoteService.update(id, data);
export const deleteTaskQuote = (id: string) => taskQuoteService.delete(id);
export const updateTaskQuoteStatus = (id: string, status: TASK_QUOTE_STATUS, reason?: string) => taskQuoteService.updateStatus(id, status, reason);
export const approveTaskQuote = (id: string) => taskQuoteService.approve(id);
export const budgetApproveTaskQuote = (id: string) => taskQuoteService.budgetApprove(id);
export const commercialApproveTaskQuote = (id: string) => taskQuoteService.commercialApprove(id);
export const internalApproveTaskQuote = (id: string) => taskQuoteService.internalApprove(id);
export const rejectTaskQuote = (id: string, reason?: string) => taskQuoteService.reject(id, reason);
export const cancelTaskQuote = (id: string) => taskQuoteService.cancel(id);
export const getExpiredTaskQuotes = () => taskQuoteService.getExpired();
export const getPublicTaskQuote = (id: string) => taskQuoteService.getPublic(id);
