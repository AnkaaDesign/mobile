// packages/api-client/src/warning.ts

import { apiClient } from "./axiosClient";
import type {
  // Schema types (for parameters)
  WarningGetManyFormData,
  WarningGetByIdFormData,
  WarningCreateFormData,
  WarningUpdateFormData,
  WarningBatchCreateFormData,
  WarningBatchUpdateFormData,
  WarningBatchDeleteFormData,
  WarningQueryFormData,
} from '../schemas';
import type {
  // Interface types (for responses)
  Warning,
  WarningGetUniqueResponse,
  WarningGetManyResponse,
  WarningCreateResponse,
  WarningUpdateResponse,
  WarningDeleteResponse,
  WarningBatchCreateResponse,
  WarningBatchUpdateResponse,
  WarningBatchDeleteResponse,
} from '../types';

// =====================
// Warning Service Class
// =====================

export class WarningService {
  private readonly basePath = "/warnings";

  // =====================
  // Query Operations
  // =====================

  async getWarnings(params?: WarningGetManyFormData): Promise<WarningGetManyResponse> {
    const response = await apiClient.get<WarningGetManyResponse>(this.basePath, {
      params,
    });
    return response.data;
  }

  async getWarningById(id: string, params?: Omit<WarningGetByIdFormData, "id">): Promise<WarningGetUniqueResponse> {
    const response = await apiClient.get<WarningGetUniqueResponse>(`${this.basePath}/${id}`, {
      params,
    });
    return response.data;
  }

  async getMyWarnings(params?: WarningGetManyFormData): Promise<WarningGetManyResponse> {
    const response = await apiClient.get<WarningGetManyResponse>(`${this.basePath}/my-warnings`, {
      params,
    });
    return response.data;
  }

  async getTeamWarnings(params?: WarningGetManyFormData): Promise<WarningGetManyResponse> {
    const response = await apiClient.get<WarningGetManyResponse>(`${this.basePath}/team-warnings`, {
      params,
    });
    return response.data;
  }

  // =====================
  // Mutation Operations
  // =====================

  async createWarning(data: WarningCreateFormData, query?: WarningQueryFormData): Promise<WarningCreateResponse> {
    const response = await apiClient.post<WarningCreateResponse>(this.basePath, data, {
      params: query,
    });
    return response.data;
  }

  async updateWarning(id: string, data: WarningUpdateFormData, query?: WarningQueryFormData): Promise<WarningUpdateResponse> {
    const response = await apiClient.put<WarningUpdateResponse>(`${this.basePath}/${id}`, data, {
      params: query,
    });
    return response.data;
  }

  async deleteWarning(id: string): Promise<WarningDeleteResponse> {
    const response = await apiClient.delete<WarningDeleteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  // =====================
  // Batch Operations
  // =====================

  async batchCreateWarnings(data: WarningBatchCreateFormData, query?: WarningQueryFormData): Promise<WarningBatchCreateResponse<Warning>> {
    const response = await apiClient.post<WarningBatchCreateResponse<Warning>>(`${this.basePath}/batch`, data, {
      params: query,
    });
    return response.data;
  }

  async batchUpdateWarnings(data: WarningBatchUpdateFormData, query?: WarningQueryFormData): Promise<WarningBatchUpdateResponse<Warning>> {
    const response = await apiClient.put<WarningBatchUpdateResponse<Warning>>(`${this.basePath}/batch`, data, {
      params: query,
    });
    return response.data;
  }

  async batchDeleteWarnings(data: WarningBatchDeleteFormData, query?: WarningQueryFormData): Promise<WarningBatchDeleteResponse> {
    const response = await apiClient.delete<WarningBatchDeleteResponse>(`${this.basePath}/batch`, {
      data,
      params: query,
    });
    return response.data;
  }
}

// =====================
// Warning Signing Service (in-app electronic signature / refusal)
// =====================

export type WarningSignerRole = "COLLABORATOR" | "WITNESS";

export interface WarningSignResponse {
  success: boolean;
  signatureId: string;
  hmac: string;
  signerRole: WarningSignerRole;
}

export interface WarningRefuseSignResponse {
  success: boolean;
  signatureId: string;
}

export interface WarningVerifySignatureResponse {
  valid: boolean;
  signatures: { signatureId: string; signerRole: WarningSignerRole; valid: boolean }[];
  details?: string;
}

export class WarningSigningService {
  private static readonly basePath = "/warnings";

  /**
   * Sign a warning. Works for BOTH the collaborator and witnesses — the API
   * infers the role from the logged-in user. The evidence payload mirrors the
   * PPE delivery sign call.
   */
  static async signWarning(
    warningId: string,
    evidence: Record<string, any>,
  ): Promise<WarningSignResponse> {
    const response = await apiClient.post<WarningSignResponse>(
      `${this.basePath}/${warningId}/sign`,
      evidence,
    );
    return response.data;
  }

  /**
   * Register that the collaborator refused to sign the warning. Same evidence
   * fields plus `refusedReason`. The API rejects with 400 when the warning has
   * fewer than 2 witnesses.
   */
  static async refuseWarningSignature(
    warningId: string,
    evidence: Record<string, any> & { refusedReason: string },
  ): Promise<WarningRefuseSignResponse> {
    const response = await apiClient.post<WarningRefuseSignResponse>(
      `${this.basePath}/${warningId}/refuse-signature`,
      evidence,
    );
    return response.data;
  }

  /** Verify the integrity of every signature attached to the warning. */
  static async verifySignature(
    warningId: string,
  ): Promise<WarningVerifySignatureResponse> {
    const response = await apiClient.get<WarningVerifySignatureResponse>(
      `${this.basePath}/${warningId}/signature/verify`,
    );
    return response.data;
  }
}

// =====================
// Export service instance
// =====================

export const warningService = new WarningService();

// =====================
// Export individual functions
// =====================

// Query Operations
export const getWarnings = (params?: WarningGetManyFormData) => warningService.getWarnings(params);
export const getWarningById = (id: string, params?: Omit<WarningGetByIdFormData, "id">) => warningService.getWarningById(id, params);
export const getMyWarnings = (params?: WarningGetManyFormData) => warningService.getMyWarnings(params);
export const getTeamWarnings = (params?: WarningGetManyFormData) => warningService.getTeamWarnings(params);

// Mutation Operations
export const createWarning = (data: WarningCreateFormData, query?: WarningQueryFormData) => warningService.createWarning(data, query);
export const updateWarning = (id: string, data: WarningUpdateFormData, query?: WarningQueryFormData) => warningService.updateWarning(id, data, query);
export const deleteWarning = (id: string) => warningService.deleteWarning(id);

// Batch Operations
export const batchCreateWarnings = (data: WarningBatchCreateFormData, query?: WarningQueryFormData) => warningService.batchCreateWarnings(data, query);
export const batchUpdateWarnings = (data: WarningBatchUpdateFormData, query?: WarningQueryFormData) => warningService.batchUpdateWarnings(data, query);
export const batchDeleteWarnings = (data: WarningBatchDeleteFormData, query?: WarningQueryFormData) => warningService.batchDeleteWarnings(data, query);
