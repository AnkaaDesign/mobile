import { useQuery } from "@tanstack/react-query";
import { nfseService } from '@/api-client/nfse';

// =====================================================
// NFSe Query Keys
// =====================================================

export const nfseKeys = {
  all: ["nfse"] as const,
  detail: (id: number) => ["nfse", "detail", id] as const,
  pdf: (id: number) => ["nfse", "pdf", id] as const,
};

// ===============================================
// NFSE HOOKS - Queries
// ===============================================

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
