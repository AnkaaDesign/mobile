// packages/api/src/nfse.ts

import { apiClient } from "./axiosClient";

// =====================
// NFSe Service Class
// =====================

export class NfseService {
  private readonly basePath = "/nfse";

  // =====================
  // Query Operations
  // =====================

  async detail(elotechNfseId: number): Promise<any> {
    const response = await apiClient.get(`${this.basePath}/${elotechNfseId}`);
    return response.data;
  }

  async getPdf(elotechNfseId: number): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/${elotechNfseId}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  }
}

// =====================
// Singleton Instance
// =====================

export const nfseService = new NfseService();

// =====================
// Convenience Functions
// =====================

export const getNfseDetail = (elotechNfseId: number) => nfseService.detail(elotechNfseId);
export const getNfsePdf = (elotechNfseId: number) => nfseService.getPdf(elotechNfseId);
