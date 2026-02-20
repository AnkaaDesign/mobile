import { apiClient } from "./axiosClient";
import type {
  ResponsibleGetManyFormData,
  ResponsibleCreateFormData,
  ResponsibleUpdateFormData,
  ResponsibleBatchCreateFormData,
  ResponsibleBatchUpdateFormData,
  ResponsibleBatchDeleteFormData,
} from '../schemas';
import type {
  Responsible,
  ResponsibleGetManyResponse,
} from '../types';

export class ResponsibleApiService {
  private readonly basePath = "/responsibles";

  async getResponsibles(params?: ResponsibleGetManyFormData): Promise<ResponsibleGetManyResponse> {
    const response = await apiClient.get<ResponsibleGetManyResponse>(this.basePath, {
      params,
    });
    return response.data;
  }

  async getResponsibleById(id: string): Promise<Responsible> {
    const response = await apiClient.get<Responsible>(`${this.basePath}/${id}`);
    return response.data;
  }

  async createResponsible(data: ResponsibleCreateFormData): Promise<Responsible> {
    const response = await apiClient.post<Responsible>(this.basePath, data);
    return response.data;
  }

  async updateResponsible(id: string, data: ResponsibleUpdateFormData): Promise<Responsible> {
    const response = await apiClient.put<Responsible>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async deleteResponsible(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async batchCreateResponsibles(data: ResponsibleBatchCreateFormData): Promise<Responsible[]> {
    const response = await apiClient.post<Responsible[]>(`${this.basePath}/batch`, data);
    return response.data;
  }

  async batchUpdateResponsibles(data: ResponsibleBatchUpdateFormData): Promise<Responsible[]> {
    const response = await apiClient.put<Responsible[]>(`${this.basePath}/batch`, data);
    return response.data;
  }

  async batchDeleteResponsibles(data: ResponsibleBatchDeleteFormData): Promise<void> {
    await apiClient.delete(`${this.basePath}/batch`, { data });
  }
}

export const responsibleApiService = new ResponsibleApiService();

// Individual function exports
export const getResponsibles = (params?: ResponsibleGetManyFormData) => responsibleApiService.getResponsibles(params);
export const getResponsibleById = (id: string) => responsibleApiService.getResponsibleById(id);
export const createResponsible = (data: ResponsibleCreateFormData) => responsibleApiService.createResponsible(data);
export const updateResponsible = (id: string, data: ResponsibleUpdateFormData) => responsibleApiService.updateResponsible(id, data);
export const deleteResponsible = (id: string) => responsibleApiService.deleteResponsible(id);
export const batchCreateResponsibles = (data: ResponsibleBatchCreateFormData) => responsibleApiService.batchCreateResponsibles(data);
export const batchUpdateResponsibles = (data: ResponsibleBatchUpdateFormData) => responsibleApiService.batchUpdateResponsibles(data);
export const batchDeleteResponsibles = (data: ResponsibleBatchDeleteFormData) => responsibleApiService.batchDeleteResponsibles(data);
