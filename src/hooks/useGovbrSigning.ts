import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  SigningState,
  SigningStep,
  GovbrEnvironment,
  INITIAL_SIGNING_STATE,
} from '@/services/govbr-signing/types';
import { authenticateAndSign } from '@/services/govbr-signing/govbr-signing-service';

export function useGovbrSigning(environment: GovbrEnvironment) {
  const [state, setState] = useState<SigningState>(INITIAL_SIGNING_STATE);

  const updateStep = useCallback((step: SigningStep) => {
    setState((prev) => ({ ...prev, step, error: null }));
  }, []);

  const pickDocument = useCallback(async () => {
    updateStep('picking_document');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        setState(INITIAL_SIGNING_STATE);
        return;
      }

      const asset = result.assets[0];
      setState((prev) => ({
        ...prev,
        step: 'idle',
        document: {
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
        },
        signature: null,
        signedAt: null,
        hashBase64: null,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao selecionar documento.',
      }));
    }
  }, [updateStep]);

  const signDocument = useCallback(async () => {
    if (!state.document) return;

    try {
      const result = await authenticateAndSign(
        state.document.uri,
        environment,
        (step) => updateStep(step as SigningStep),
      );

      setState((prev) => ({
        ...prev,
        step: 'completed',
        signature: result.signature,
        signedAt: result.signedAt,
        hashBase64: result.hashBase64,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao assinar documento.',
      }));
    }
  }, [state.document, environment, updateStep]);

  const reset = useCallback(() => {
    setState(INITIAL_SIGNING_STATE);
  }, []);

  return {
    state,
    pickDocument,
    signDocument,
    reset,
  };
}
