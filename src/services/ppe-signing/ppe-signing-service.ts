/**
 * PPE In-App Signing Service
 *
 * Orchestrates the full signing flow:
 * 1. Biometric authentication
 * 2. Evidence collection (device, location, network)
 * 3. SHA-256 hash computation
 * 4. POST to backend /ppe/deliveries/:id/sign
 */

import {
  authenticateWithBiometric,
  collectAllEvidence,
  computeEvidenceHash,
} from './collect-evidence';
import type { PpeSigningStep } from './types';
import { PpeDeliveryService } from '@/api-client/ppe';

export interface SignDeliveryResult {
  signatureId: string;
  hmac: string;
}

/**
 * Sign a PPE delivery with biometric evidence.
 *
 * @param deliveryId - The delivery UUID to sign
 * @param onStep - Callback for UI progress updates
 * @returns The signature result with signatureId and HMAC
 * @throws Error with user-friendly Portuguese message on failure
 */
export async function signPpeDelivery(
  deliveryId: string,
  onStep?: (step: PpeSigningStep) => void,
): Promise<SignDeliveryResult> {
  try {
    // Step 1: Biometric authentication
    onStep?.('requesting_biometric');
    const biometricResult = await authenticateWithBiometric();

    if (!biometricResult.success) {
      throw new Error('Autenticação biométrica cancelada ou falhou. Tente novamente.');
    }

    // Step 2: Collect evidence (device, location, network — in parallel)
    onStep?.('collecting_evidence');
    const evidence = await collectAllEvidence(biometricResult);

    // Step 3: Compute SHA-256 hash
    onStep?.('hashing');
    const evidenceHash = await computeEvidenceHash(evidence);

    // Step 4: Send to backend
    onStep?.('sending');
    const response = await PpeDeliveryService.signDeliveryInApp(deliveryId, {
      ...evidence,
      evidenceHash,
    });

    onStep?.('completed');

    return {
      signatureId: response.signatureId,
      hmac: response.hmac,
    };
  } catch (error: any) {
    onStep?.('error');

    // Re-throw with user-friendly message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
