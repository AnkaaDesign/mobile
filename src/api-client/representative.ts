import { apiClient } from "./axiosClient";
import type {
  RepresentativeGetManyFormData,
  RepresentativeCreateFormData,
  RepresentativeUpdateFormData,
  RepresentativeBatchCreateFormData,
  RepresentativeBatchUpdateFormData,
  RepresentativeBatchDeleteFormData,
} from '../schemas';
import type {
  Representative,
  RepresentativeGetManyResponse,
} from '../types';

export class RepresentativeApiService {
  private readonly basePath = "/representatives";

  async getRepresentatives(params?: RepresentativeGetManyFormData): Promise<RepresentativeGetManyResponse> {
    const response = await apiClient.get<RepresentativeGetManyResponse>(this.basePath, {
      params,
    });
    return response.data;
  }

  async getRepresentativeById(id: string): Promise<Representative> {
    const response = await apiClient.get<Representative>(`${this.basePath}/${id}`);
    return response.data;
  }

  async createRepresentative(data: RepresentativeCreateFormData): Promise<Representative> {
    const response = await apiClient.post<Representative>(this.basePath, data);
    return response.data;
  }

  async updateRepresentative(id: string, data: RepresentativeUpdateFormData): Promise<Representative> {
    const response = await apiClient.put<Representative>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async deleteRepresentative(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async batchCreateRepresentatives(data: RepresentativeBatchCreateFormData): Promise<Representative[]> {
    const response = await apiClient.post<Representative[]>(`${this.basePath}/batch`, data);
    return response.data;
  }

  async batchUpdateRepresentatives(data: RepresentativeBatchUpdateFormData): Promise<Representative[]> {
    const response = await apiClient.put<Representative[]>(`${this.basePath}/batch`, data);
    return response.data;
  }

  async batchDeleteRepresentatives(data: RepresentativeBatchDeleteFormData): Promise<void> {
    await apiClient.delete(`${this.basePath}/batch`, { data });
  }
}

export const representativeApiService = new RepresentativeApiService();

// Individual function exports
export const getRepresentatives = (params?: RepresentativeGetManyFormData) => representativeApiService.getRepresentatives(params);
export const getRepresentativeById = (id: string) => representativeApiService.getRepresentativeById(id);
export const createRepresentative = (data: RepresentativeCreateFormData) => representativeApiService.createRepresentative(data);
export const updateRepresentative = (id: string, data: RepresentativeUpdateFormData) => representativeApiService.updateRepresentative(id, data);
export const deleteRepresentative = (id: string) => representativeApiService.deleteRepresentative(id);
export const batchCreateRepresentatives = (data: RepresentativeBatchCreateFormData) => representativeApiService.batchCreateRepresentatives(data);
export const batchUpdateRepresentatives = (data: RepresentativeBatchUpdateFormData) => representativeApiService.batchUpdateRepresentatives(data);
export const batchDeleteRepresentatives = (data: RepresentativeBatchDeleteFormData) => representativeApiService.batchDeleteRepresentatives(data);
