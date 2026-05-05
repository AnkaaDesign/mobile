/**
 * PPE In-App Signing Service
 *
 * Orchestrates the full signing flow:
 * 1. Biometric authentication
 * 2. Evidence collection (device, location, network)
 * 3. SHA-256 hash computation
 * 4. POST to backend /ppe/deliveries/:id/sign
 *
 * Each lifecycle event (BIOMETRIC_PROMPTED, BIOMETRIC_SUCCEEDED,
 * BIOMETRIC_FAILED) is sent best-effort to /ppe/deliveries/:id/track for the
 * server-side audit trail. Logging failures are intentionally swallowed.
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

type TrackedEvent =
  | 'DOCUMENT_VIEWED'
  | 'BIOMETRIC_PROMPTED'
  | 'BIOMETRIC_SUCCEEDED'
  | 'BIOMETRIC_FAILED'
  | 'PDF_DOWNLOADED';

/**
 * Best-effort audit event logging. Never throws — audit failures must not
 * block or surface to the user.
 */
export async function trackPpeDeliveryEvent(
  deliveryId: string,
  event: TrackedEvent,
  metadata?: Record<string, any>,
): Promise<void> {
  try {
    await PpeDeliveryService.trackDeliveryEvent(deliveryId, { event, metadata });
  } catch {
    // intentionally silent
  }
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
    void trackPpeDeliveryEvent(deliveryId, 'BIOMETRIC_PROMPTED');

    const biometricResult = await authenticateWithBiometric();

    if (!biometricResult.success) {
      void trackPpeDeliveryEvent(deliveryId, 'BIOMETRIC_FAILED', {
        method: biometricResult.method,
        reason: 'cancelled_or_failed',
      });
      throw new Error('Autenticação biométrica cancelada ou falhou. Tente novamente.');
    }

    void trackPpeDeliveryEvent(deliveryId, 'BIOMETRIC_SUCCEEDED', {
      method: biometricResult.method,
    });

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
