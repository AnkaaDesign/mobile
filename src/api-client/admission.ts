// api-client/admission.ts
// Admissões (Departamento Pessoal)

import { apiClient } from "./axiosClient";
import type {
  AdmissionGetManyFormData,
  AdmissionCreateFormData,
  AdmissionUpdateFormData,
  AdmissionBatchCreateFormData,
  AdmissionBatchUpdateFormData,
  AdmissionBatchDeleteFormData,
  AdmissionAdvanceFormData,
  AdmissionDocumentUploadFormData,
  AdmissionDocumentUpdateFormData,
} from "../schemas/admission";
import type {
  Admission,
  AdmissionGetUniqueResponse,
  AdmissionGetManyResponse,
  AdmissionCreateResponse,
  AdmissionUpdateResponse,
  AdmissionDeleteResponse,
  AdmissionBatchCreateResponse,
  AdmissionBatchUpdateResponse,
  AdmissionBatchDeleteResponse,
  AdmissionDocumentUpdateResponse,
} from "../types/admission";

// =====================
// Admission Service Class
// =====================

export class AdmissionService {
  private readonly basePath = "/admissions";

  // Query Operations
  async getAdmissions(params?: AdmissionGetManyFormData): Promise<AdmissionGetManyResponse> {
    const response = await apiClient.get<AdmissionGetManyResponse>(this.basePath, { params });
    return response.data;
  }

  async getAdmissionById(id: string, params?: any): Promise<AdmissionGetUniqueResponse> {
    const response = await apiClient.get<AdmissionGetUniqueResponse>(`${this.basePath}/${id}`, { params });
    return response.data;
  }

  /**
   * Documentação do colaborador — busca a admissão (1:1) pelo userId.
   * Retorna data: null quando o colaborador ainda não possui admissão.
   */
  async getAdmissionByUser(userId: string, params?: any): Promise<AdmissionGetUniqueResponse> {
    const response = await apiClient.get<AdmissionGetUniqueResponse>(`${this.basePath}/by-user/${userId}`, { params });
    return response.data;
  }

  // Mutation Operations
  async createAdmission(data: AdmissionCreateFormData, query?: any): Promise<AdmissionCreateResponse> {
    const response = await apiClient.post<AdmissionCreateResponse>(this.basePath, data, { params: query });
    return response.data;
  }

  async updateAdmission(id: string, data: AdmissionUpdateFormData, query?: any): Promise<AdmissionUpdateResponse> {
    const response = await apiClient.put<AdmissionUpdateResponse>(`${this.basePath}/${id}`, data, { params: query });
    return response.data;
  }

  async deleteAdmission(id: string): Promise<AdmissionDeleteResponse> {
    const response = await apiClient.delete<AdmissionDeleteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  // Status Machine
  async advanceAdmission(id: string, data: AdmissionAdvanceFormData = {}, query?: any): Promise<AdmissionUpdateResponse> {
    const response = await apiClient.put<AdmissionUpdateResponse>(`${this.basePath}/${id}/advance`, data, { params: query });
    return response.data;
  }

  // Document Operations
  async uploadAdmissionDocument(id: string, data: AdmissionDocumentUploadFormData, file: any): Promise<AdmissionDocumentUpdateResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", data.type);
    if (data.note) {
      formData.append("note", data.note);
    }

    const response = await apiClient.post<AdmissionDocumentUpdateResponse>(`${this.basePath}/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async updateAdmissionDocument(documentId: string, data: AdmissionDocumentUpdateFormData): Promise<AdmissionDocumentUpdateResponse> {
    const response = await apiClient.put<AdmissionDocumentUpdateResponse>(`${this.basePath}/documents/${documentId}`, data);
    return response.data;
  }

  // =====================
  // In-App Electronic Signature (e.g. Termo LGPD)
  // =====================
  // Mirrors the PPE delivery sign endpoint. `evidence` is the canonical evidence
  // payload + evidenceHash (SHA-256). The server enforces owner-or-HR/ADMIN and
  // requires the document to already carry a source fileId (else 400).

  /** POST /admissions/documents/:documentId/sign */
  async signAdmissionDocument(
    documentId: string,
    evidence: Record<string, any>,
  ): Promise<{ success: boolean; message: string; documentId: string; signedFileId: string | null; hmac: string; padesSealed: boolean }> {
    const response = await apiClient.post(`${this.basePath}/documents/${documentId}/sign`, evidence);
    return response.data;
  }

  /** GET /admissions/documents/:documentId/signature */
  async getAdmissionDocumentSignature(documentId: string): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.get(`${this.basePath}/documents/${documentId}/signature`);
    return response.data;
  }

  /**
   * Documentação do colaborador — upload pelo userId; o processo de admissão é
   * criado preguiçosamente no servidor quando ainda não existe.
   */
  async uploadAdmissionDocumentByUser(userId: string, data: AdmissionDocumentUploadFormData, file: any): Promise<AdmissionDocumentUpdateResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", data.type);
    if (data.note) {
      formData.append("note", data.note);
    }

    const response = await apiClient.post<AdmissionDocumentUpdateResponse>(`${this.basePath}/by-user/${userId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  // Batch Operations
  async batchCreateAdmissions(data: AdmissionBatchCreateFormData, query?: any): Promise<AdmissionBatchCreateResponse<Admission>> {
    const response = await apiClient.post<AdmissionBatchCreateResponse<Admission>>(`${this.basePath}/batch`, data, { params: query });
    return response.data;
  }

  async batchUpdateAdmissions(data: AdmissionBatchUpdateFormData, query?: any): Promise<AdmissionBatchUpdateResponse<Admission>> {
    const response = await apiClient.put<AdmissionBatchUpdateResponse<Admission>>(`${this.basePath}/batch`, data, { params: query });
    return response.data;
  }

  async batchDeleteAdmissions(data: AdmissionBatchDeleteFormData, query?: any): Promise<AdmissionBatchDeleteResponse> {
    const response = await apiClient.delete<AdmissionBatchDeleteResponse>(`${this.basePath}/batch`, { data, params: query });
    return response.data;
  }
}

export const admissionService = new AdmissionService();

// Query Operations
export const getAdmissions = (params?: AdmissionGetManyFormData) => admissionService.getAdmissions(params);
export const getAdmissionById = (id: string, params?: any) => admissionService.getAdmissionById(id, params);
export const getAdmissionByUser = (userId: string, params?: any) => admissionService.getAdmissionByUser(userId, params);

// Mutation Operations
export const createAdmission = (data: AdmissionCreateFormData, query?: any) => admissionService.createAdmission(data, query);
export const updateAdmission = (id: string, data: AdmissionUpdateFormData, query?: any) => admissionService.updateAdmission(id, data, query);
export const deleteAdmission = (id: string) => admissionService.deleteAdmission(id);

// Status Machine
export const advanceAdmission = (id: string, data?: AdmissionAdvanceFormData, query?: any) => admissionService.advanceAdmission(id, data, query);

// Document Operations
export const uploadAdmissionDocument = (id: string, data: AdmissionDocumentUploadFormData, file: any) => admissionService.uploadAdmissionDocument(id, data, file);
export const updateAdmissionDocument = (documentId: string, data: AdmissionDocumentUpdateFormData) => admissionService.updateAdmissionDocument(documentId, data);
export const signAdmissionDocument = (documentId: string, evidence: Record<string, any>) => admissionService.signAdmissionDocument(documentId, evidence);
export const getAdmissionDocumentSignature = (documentId: string) => admissionService.getAdmissionDocumentSignature(documentId);
export const uploadAdmissionDocumentByUser = (userId: string, data: AdmissionDocumentUploadFormData, file: any) => admissionService.uploadAdmissionDocumentByUser(userId, data, file);

// Batch Operations
export const batchCreateAdmissions = (data: AdmissionBatchCreateFormData, query?: any) => admissionService.batchCreateAdmissions(data, query);
export const batchUpdateAdmissions = (data: AdmissionBatchUpdateFormData, query?: any) => admissionService.batchUpdateAdmissions(data, query);
export const batchDeleteAdmissions = (data: AdmissionBatchDeleteFormData, query?: any) => admissionService.batchDeleteAdmissions(data, query);
