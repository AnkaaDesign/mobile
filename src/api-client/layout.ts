// packages/api-client/src/layout.ts

import { apiClient } from "./axiosClient";
import type {
  Layout,
  LayoutGetUniqueResponse,
  LayoutGetManyResponse,
  LayoutCreateResponse,
  LayoutUpdateResponse,
  LayoutDeleteResponse,
  LayoutBatchCreateResponse,
  LayoutBatchUpdateResponse,
  LayoutBatchDeleteResponse,
} from '../types';
import type { LayoutCreateFormData, LayoutUpdateFormData } from '../schemas';
import { safeFileDownload } from "./platform-utils";

// =====================
// Custom Response Types
// =====================

export interface LayoutsByTruckResponse {
  success: boolean;
  message: string;
  data: {
    leftSideLayout: Layout | null;
    rightSideLayout: Layout | null;
    backSideLayout: Layout | null;
  };
}

export interface LayoutListResponse {
  success: boolean;
  message: string;
  data: Layout[];
}

export interface LayoutUsageResponse {
  success: boolean;
  message: string;
  data: {
    layoutId: string;
    trucks: Array<{
      truckId: string;
      side: "left" | "right" | "back";
    }>;
  };
}

export interface LayoutAssignResponse {
  success: boolean;
  message: string;
  data: Layout;
}

// Extended type for layout data with photo URI
export interface LayoutDataWithPhoto extends LayoutCreateFormData {
  photoUri?: string;
}

// =====================
// Layout Service Class
// =====================

export class LayoutService {
  private readonly basePath = "/layout";

  // =====================
  // Query Operations
  // =====================

  async getById(id: string, params?: { include?: any }): Promise<LayoutGetUniqueResponse> {
    const response = await apiClient.get<LayoutGetUniqueResponse>(`${this.basePath}/${id}`, { params });
    return response.data;
  }

  async getByTruckId(truckId: string, params?: { include?: any }): Promise<LayoutsByTruckResponse> {
    const response = await apiClient.get<LayoutsByTruckResponse>(`${this.basePath}/truck/${truckId}`, { params });
    return response.data;
  }

  async listLayouts(options?: { includeUsage?: boolean; includeSections?: boolean }): Promise<LayoutListResponse> {
    const response = await apiClient.get<LayoutListResponse>(this.basePath, { params: options });
    return response.data;
  }

  async getLayoutUsage(layoutId: string): Promise<LayoutUsageResponse> {
    const response = await apiClient.get<LayoutUsageResponse>(`${this.basePath}/${layoutId}/usage`);
    return response.data;
  }

  // =====================
  // Mutation Operations
  // =====================

  async create(data: LayoutCreateFormData): Promise<LayoutCreateResponse> {
    const response = await apiClient.post<LayoutCreateResponse>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: LayoutUpdateFormData): Promise<LayoutUpdateResponse> {
    const response = await apiClient.put<LayoutUpdateResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<LayoutDeleteResponse> {
    const response = await apiClient.delete<LayoutDeleteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  // =====================
  // Batch Operations
  // =====================

  async batchCreate(data: LayoutCreateFormData[]): Promise<LayoutBatchCreateResponse<LayoutCreateFormData>> {
    const response = await apiClient.post<LayoutBatchCreateResponse<LayoutCreateFormData>>(`${this.basePath}/batch`, { data });
    return response.data;
  }

  async batchUpdate(data: Array<LayoutUpdateFormData & { id: string }>): Promise<LayoutBatchUpdateResponse<LayoutUpdateFormData & { id: string }>> {
    const response = await apiClient.put<LayoutBatchUpdateResponse<LayoutUpdateFormData & { id: string }>>(`${this.basePath}/batch`, { data });
    return response.data;
  }

  async batchDelete(data: { ids: string[] }): Promise<LayoutBatchDeleteResponse> {
    const response = await apiClient.delete<LayoutBatchDeleteResponse>(`${this.basePath}/batch`, { data });
    return response.data;
  }

  // =====================
  // Special Operations
  // =====================

  async assignLayoutToTruck(layoutId: string, data: { truckId: string; side: "left" | "right" | "back" }): Promise<LayoutAssignResponse> {
    const response = await apiClient.post<LayoutAssignResponse>(`${this.basePath}/${layoutId}/assign-to-truck`, data);
    return response.data;
  }

  async createOrUpdateTruckLayout(
    truckId: string,
    side: "left" | "right" | "back",
    data: LayoutDataWithPhoto,
    existingLayoutId?: string
  ): Promise<LayoutCreateResponse | LayoutAssignResponse> {
    // If existingLayoutId is provided, use the assignLayoutToTruck endpoint
    if (existingLayoutId) {
      return this.assignLayoutToTruck(existingLayoutId, { truckId, side });
    }

    // Check if there's a photo to upload (only backside supports photos)
    if (data.photoUri && side === 'back') {
      // Use FormData for file upload
      const formData = new FormData();

      // Add layout data fields
      formData.append('height', String(data.height));
      formData.append('layoutSections', JSON.stringify(data.layoutSections));
      if (data.photoId) {
        formData.append('photoId', data.photoId);
      }

      // Add photo file
      formData.append('photo', {
        uri: data.photoUri,
        name: `layout-photo-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const response = await apiClient.post<LayoutCreateResponse>(
        `${this.basePath}/truck/${truckId}/${side}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    }

    // No photo - send as JSON
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photoUri, ...layoutData } = data;
    const response = await apiClient.post<LayoutCreateResponse>(`${this.basePath}/truck/${truckId}/${side}`, layoutData);
    return response.data;
  }

  // =====================
  // Export Operations
  // =====================

  async generateSVG(id: string): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/${id}/svg`, { responseType: "blob" });
    return response.data;
  }

  async downloadSVG(id: string, filename?: string): Promise<Blob | undefined> {
    const blob = await this.generateSVG(id);

    const success = safeFileDownload(blob, filename || `layout-${id}.svg`);

    // Return the blob for React Native or other environments to handle
    return success ? undefined : blob;
  }
}

// =====================
// Service Instance
// =====================

export const layoutService = new LayoutService();
