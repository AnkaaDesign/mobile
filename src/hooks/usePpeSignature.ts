/**
 * Hook for PPE in-app electronic signature
 *
 * Wraps the signing flow with react-query mutation and state tracking.
 * Invalidates delivery queries on success for cache refresh.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signPpeDelivery } from '@/services/ppe-signing';
import { PpeDeliveryService } from '@/api-client/ppe';
import { ppeDeliveryKeys } from './queryKeys';
import type { PpeSigningStep, PpeSigningState } from '@/services/ppe-signing';
import { INITIAL_SIGNING_STATE } from '@/services/ppe-signing';

export function usePpeSignature() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<PpeSigningState>(INITIAL_SIGNING_STATE);

  const updateStep = useCallback((step: PpeSigningStep) => {
    setState(prev => ({ ...prev, step, error: null }));
  }, []);

  const mutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      setState({ step: 'requesting_biometric', error: null, signatureId: null, hmac: null });
      return signPpeDelivery(deliveryId, updateStep);
    },
    onSuccess: (result) => {
      setState({
        step: 'completed',
        error: null,
        signatureId: result.signatureId,
        hmac: result.hmac,
      });

      // Invalidate PPE delivery queries to refresh the list/detail
      queryClient.invalidateQueries({ queryKey: ppeDeliveryKeys.all });
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message || 'Erro ao assinar entrega de EPI.',
      }));
    },
  });

  const sign = useCallback(
    (deliveryId: string) => {
      mutation.mutate(deliveryId);
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
 * Hook for verifying signature integrity
 */
export function usePpeSignatureVerification() {
  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const result = await PpeDeliveryService.verifySignature(deliveryId);
      return result;
    },
  });
}

/**
 * Hook for fetching signature details
 */
export function usePpeSignatureDetails(deliveryId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!deliveryId) throw new Error('Delivery ID is required');
      const result = await PpeDeliveryService.getSignatureDetails(deliveryId);
      return result.data;
    },
  });
}
