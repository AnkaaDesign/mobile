/**
 * Hooks for warning (Advertência) in-app electronic signature / refusal.
 *
 * Wraps the signing flow with react-query mutations and step state tracking.
 * Invalidates warning queries on success for cache refresh.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signWarning, refuseWarningSignature } from '@/services/warning-signing';
import { WarningSigningService } from '@/api-client/warning';
import { warningKeys } from './queryKeys';
import type { WarningSigningStep, WarningSigningState } from '@/services/warning-signing';
import { INITIAL_WARNING_SIGNING_STATE } from '@/services/warning-signing';

/**
 * Hook for signing a warning (collaborator OR witness — API infers the role).
 */
export function useWarningSignature() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WarningSigningState>(INITIAL_WARNING_SIGNING_STATE);

  const updateStep = useCallback((step: WarningSigningStep) => {
    setState(prev => ({ ...prev, step, error: null }));
  }, []);

  const mutation = useMutation({
    mutationFn: async (warningId: string) => {
      setState({
        step: 'requesting_biometric',
        error: null,
        signatureId: null,
        hmac: null,
        signerRole: null,
      });
      return signWarning(warningId, updateStep);
    },
    onSuccess: (result) => {
      setState({
        step: 'completed',
        error: null,
        signatureId: result.signatureId,
        hmac: result.hmac,
        signerRole: result.signerRole,
      });
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message || 'Erro ao assinar advertência.',
      }));
    },
  });

  const sign = useCallback(
    (warningId: string) => {
      mutation.mutate(warningId);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setState(INITIAL_WARNING_SIGNING_STATE);
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
 * Hook for registering a refusal-to-sign (supervisor/HR only).
 */
export function useWarningSignatureRefusal() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WarningSigningState>(INITIAL_WARNING_SIGNING_STATE);

  const updateStep = useCallback((step: WarningSigningStep) => {
    setState(prev => ({ ...prev, step, error: null }));
  }, []);

  const mutation = useMutation({
    mutationFn: async ({ warningId, refusedReason }: { warningId: string; refusedReason: string }) => {
      setState({
        step: 'collecting_evidence',
        error: null,
        signatureId: null,
        hmac: null,
        signerRole: null,
      });
      return refuseWarningSignature(warningId, refusedReason, updateStep);
    },
    onSuccess: (result) => {
      setState({
        step: 'completed',
        error: null,
        signatureId: result.signatureId,
        hmac: null,
        signerRole: null,
      });
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message || 'Erro ao registrar recusa de assinatura.',
      }));
    },
  });

  const refuse = useCallback(
    (warningId: string, refusedReason: string) => {
      mutation.mutate({ warningId, refusedReason });
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setState(INITIAL_WARNING_SIGNING_STATE);
    mutation.reset();
  }, [mutation]);

  return {
    state,
    refuse,
    reset,
    isLoading: mutation.isPending,
  };
}

/**
 * Hook for verifying warning signature integrity.
 */
export function useWarningSignatureVerification() {
  return useMutation({
    mutationFn: async (warningId: string) => {
      return WarningSigningService.verifySignature(warningId);
    },
  });
}
