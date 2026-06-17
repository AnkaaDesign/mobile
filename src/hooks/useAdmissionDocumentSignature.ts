/**
 * Hook for admission document in-app electronic signature (e.g. Termo LGPD).
 *
 * Mirrors usePpeSignature: wraps the signing flow with a react-query mutation
 * and step-tracking state. Invalidates admission queries on success so the
 * detail/documents checklist refreshes with the signed status + evidence.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signAdmissionDocumentInApp } from '@/services/document-signing';
import { getAdmissionDocumentSignature } from '@/api-client/admission';
import { admissionKeys, userKeys, changeLogKeys } from './queryKeys';
import type { PpeSigningStep, PpeSigningState } from '@/services/ppe-signing/types';
import { INITIAL_SIGNING_STATE } from '@/services/ppe-signing/types';

export function useAdmissionDocumentSignature() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<PpeSigningState>(INITIAL_SIGNING_STATE);

  const updateStep = useCallback((step: PpeSigningStep) => {
    setState((prev) => ({ ...prev, step, error: null }));
  }, []);

  const mutation = useMutation({
    mutationFn: async (documentId: string) => {
      setState({ step: 'requesting_biometric', error: null, signatureId: null, hmac: null });
      return signAdmissionDocumentInApp(documentId, updateStep);
    },
    onSuccess: (result) => {
      setState({
        step: 'completed',
        error: null,
        signatureId: result.documentId,
        hmac: result.hmac,
      });

      // Refresh admission (documents checklist), user (currentContract) and changelog.
      queryClient.invalidateQueries({ queryKey: admissionKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: changeLogKeys.all });
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: error.message || 'Erro ao assinar o documento.',
      }));
    },
  });

  const sign = useCallback(
    (documentId: string) => {
      mutation.mutate(documentId);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setState(INITIAL_SIGNING_STATE);
    mutation.reset();
  }, [mutation]);

  return {
    state,
    sign,
    reset,
    isLoading: mutation.isPending,
  };
}

/**
 * Read path — signature evidence of an admission document (signedAt, signer,
 * device/network/location summary, PAdES seal). CPF is masked server-side.
 */
export function useAdmissionDocumentSignatureDetails(documentId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...admissionKeys.all, 'document-signature', documentId] as const,
    queryFn: () => getAdmissionDocumentSignature(documentId!),
    enabled: !!documentId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
  });
}
