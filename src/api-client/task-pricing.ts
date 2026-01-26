// Task Pricing API Client

import { apiClient } from "./axiosClient";
import type { TaskPricing, TASK_PRICING_STATUS } from "../types/task-pricing";

// =====================
// Response Types
// =====================

export interface TaskPricingResponse {
  success: boolean;
  data: TaskPricing;
  message?: string;
}

export interface TaskPricingListResponse {
  success: boolean;
  data: TaskPricing[];
  message?: string;
  total?: number;
}

export interface TaskPricingGetManyParams {
  taskId?: string;
  status?: TASK_PRICING_STATUS;
  limit?: number;
  offset?: number;
}

// =====================
// TaskPricing Class
// =====================

export class TaskPricingService {
  private readonly basePath = "/task-pricings";

  // =====================
  // Query Operations
  // =====================

  async getAll(params?: TaskPricingGetManyParams): Promise<TaskPricingListResponse> {
    const response = await apiClient.get<TaskPricingListResponse>(this.basePath, { params });
    return response.data;
  }

  async getById(id: string): Promise<TaskPricingResponse> {
    const response = await apiClient.get<TaskPricingResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  async getByTaskId(taskId: string): Promise<TaskPricingResponse> {
    const response = await apiClient.get<TaskPricingResponse>(`${this.basePath}/task/${taskId}`);
    return response.data;
  }

  // =====================
  // CRUD Operations
  // =====================

  async create(data: Partial<TaskPricing>): Promise<TaskPricingResponse> {
    const response = await apiClient.post<TaskPricingResponse>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: Partial<TaskPricing>): Promise<TaskPricingResponse> {
    const response = await apiClient.put<TaskPricingResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(`${this.basePath}/${id}`);
    return response.data;
  }

  // =====================
  // Status Operations
  // =====================

  async updateStatus(id: string, status: TASK_PRICING_STATUS, reason?: string): Promise<TaskPricingResponse> {
    const response = await apiClient.put<TaskPricingResponse>(`${this.basePath}/${id}/status`, { status, reason });
    return response.data;
  }

  async approve(id: string): Promise<TaskPricingResponse> {
    const response = await apiClient.put<TaskPricingResponse>(`${this.basePath}/${id}/approve`);
    return response.data;
  }

  async reject(id: string, reason?: string): Promise<TaskPricingResponse> {
    const response = await apiClient.put<TaskPricingResponse>(`${this.basePath}/${id}/reject`, { reason });
    return response.data;
  }

  async cancel(id: string): Promise<TaskPricingResponse> {
    const response = await apiClient.put<TaskPricingResponse>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  // =====================
  // Utility Operations
  // =====================

  async getExpired(): Promise<TaskPricingListResponse> {
    const response = await apiClient.get<TaskPricingListResponse>(`${this.basePath}/expired/list`);
    return response.data;
  }

  // =====================
  // Public Endpoints (No Auth Required)
  // =====================

  async getPublic(id: string): Promise<TaskPricingResponse> {
    const response = await apiClient.get<TaskPricingResponse>(`${this.basePath}/public/${id}`);
    return response.data;
  }
}

// =====================
// Service Instance & Exports
// =====================

export const taskPricingService = new TaskPricingService();

// TaskPricing exports
export const getTaskPricings = (params?: TaskPricingGetManyParams) => taskPricingService.getAll(params);
export const getTaskPricingById = (id: string) => taskPricingService.getById(id);
export const getTaskPricingByTaskId = (taskId: string) => taskPricingService.getByTaskId(taskId);
export const createTaskPricing = (data: Partial<TaskPricing>) => taskPricingService.create(data);
export const updateTaskPricing = (id: string, data: Partial<TaskPricing>) => taskPricingService.update(id, data);
export const deleteTaskPricing = (id: string) => taskPricingService.delete(id);
export const updateTaskPricingStatus = (id: string, status: TASK_PRICING_STATUS, reason?: string) => taskPricingService.updateStatus(id, status, reason);
export const approveTaskPricing = (id: string) => taskPricingService.approve(id);
export const rejectTaskPricing = (id: string, reason?: string) => taskPricingService.reject(id, reason);
export const cancelTaskPricing = (id: string) => taskPricingService.cancel(id);
export const getExpiredTaskPricings = () => taskPricingService.getExpired();
export const getPublicTaskPricing = (id: string) => taskPricingService.getPublic(id);
