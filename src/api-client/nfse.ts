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

  async list(params?: {
    dataEmissaoInicial?: string;
    dataEmissaoFinal?: string;
    situacao?: number;
    cpfCnpj?: string;
    numeroDocumentoInicial?: number;
    numeroDocumentoFinal?: number;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const response = await apiClient.get(this.basePath, { params });
    return response.data;
  }

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

  // =====================
  // Cancellation Lifecycle
  // =====================

  // Current cancellation-request status + timeline at the prefeitura (read-only).
  // GET /nfse/:elotechNfseId/cancellation
  async getCancellationStatus(elotechNfseId: number): Promise<any> {
    const response = await apiClient.get(`${this.basePath}/${elotechNfseId}/cancellation`);
    return response.data;
  }

  // Cancel an NFS-e by its local document id — works for ANY note (incl. invoice-less orphans).
  // Registers an async cancellation request at the prefeitura (AGUARDANDO_FISCAL).
  // `substituteNfseNumber` is required when reasonCode = 4 (Duplicidade).
  // PUT /nfse/document/:nfseDocumentId/cancel
  async cancelByDocument(
    nfseDocumentId: string,
    data: { reason: string; reasonCode: number; substituteNfseNumber?: number },
  ): Promise<any> {
    const response = await apiClient.put(
      `${this.basePath}/document/${nfseDocumentId}/cancel`,
      data,
    );
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

export const getNfseList = (params?: Parameters<NfseService['list']>[0]) => nfseService.list(params);
export const getNfseDetail = (elotechNfseId: number) => nfseService.detail(elotechNfseId);
export const getNfsePdf = (elotechNfseId: number) => nfseService.getPdf(elotechNfseId);
export const getNfseCancellationStatus = (elotechNfseId: number) => nfseService.getCancellationStatus(elotechNfseId);
export const cancelNfseByDocument = (
  nfseDocumentId: string,
  data: { reason: string; reasonCode: number; substituteNfseNumber?: number },
) => nfseService.cancelByDocument(nfseDocumentId, data);
