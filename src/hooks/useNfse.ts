import { useQuery } from "@tanstack/react-query";
import { nfseService } from '@/api-client/nfse';

// =====================================================
// NFSe Query Keys
// =====================================================

export const nfseKeys = {
  all: ["nfse"] as const,
  list: (filters: any) => ["nfse", "list", filters] as const,
  detail: (id: number) => ["nfse", "detail", id] as const,
  pdf: (id: number) => ["nfse", "pdf", id] as const,
};

// ===============================================
// NFSE HOOKS - Queries
// ===============================================

// -------------------------------------
// NFSE LIST
// -------------------------------------
export function useNfseList(filters: {
  dataEmissaoInicial?: string;
  dataEmissaoFinal?: string;
  situacao?: number;
  numeroDocumentoInicial?: number;
  numeroDocumentoFinal?: number;
  page?: number;
  limit?: number;
}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: nfseKeys.list(filters),
    queryFn: () => nfseService.list(filters),
    enabled: options?.enabled !== false,
  });
}

// -------------------------------------
// NFSE DETAIL
// -------------------------------------
export function useNfseDetail(elotechNfseId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: nfseKeys.detail(elotechNfseId),
    queryFn: () => nfseService.detail(elotechNfseId),
    enabled: !!elotechNfseId && (options?.enabled !== false),
  });
}
