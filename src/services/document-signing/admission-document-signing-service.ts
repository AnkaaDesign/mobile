/**
 * Admission Document In-App Signing Service
 *
 * Orchestrates the in-app electronic signature of an admission document
 * (e.g. the Termo LGPD). It REUSES the PPE signing evidence helpers unchanged
 * (`authenticateWithBiometric`, `collectAllEvidence`, `computeEvidenceHash`) so
 * the evidence payload + SHA-256 evidenceHash are computed exactly like the PPE
 * delivery flow — the API contract is identical.
 *
 * Flow:
 *   1. Biometric authentication (FaceID / fingerprint / device PIN fallback)
 *   2. Evidence collection (device, location, network — in parallel)
 *   3. SHA-256 hash computation (same canonical shape the server re-hashes)
 *   4. POST /admissions/documents/:documentId/sign
 */

import {
  authenticateWithBiometric,
  collectAllEvidence,
  computeEvidenceHash,
} from '@/services/ppe-signing/collect-evidence';
import type { PpeSigningStep } from '@/services/ppe-signing/types';
import { signAdmissionDocument } from '@/api-client/admission';

export interface SignAdmissionDocumentResult {
  documentId: string;
  signedFileId: string | null;
  hmac: string;
  padesSealed: boolean;
}

/**
 * Sign an admission document with biometric evidence.
 *
 * @param documentId - The admission document UUID to sign
 * @param onStep - Callback for UI progress updates
 * @returns The signature result with signedFileId + HMAC + padesSealed
 * @throws Error with user-friendly Portuguese message on failure
 */
export async function signAdmissionDocumentInApp(
  documentId: string,
  onStep?: (step: PpeSigningStep) => void,
): Promise<SignAdmissionDocumentResult> {
  try {
    // Step 1: Biometric authentication
    onStep?.('requesting_biometric');
    const biometricResult = await authenticateWithBiometric(
      'Confirme sua identidade para assinar o Termo LGPD',
    );

    if (!biometricResult.success) {
      throw new Error('Autenticação biométrica cancelada ou falhou. Tente novamente.');
    }

    // Step 2: Collect evidence (device, location, network — in parallel)
    onStep?.('collecting_evidence');
    const evidence = await collectAllEvidence(biometricResult);

    // Step 3: Compute SHA-256 hash (same shape the server re-hashes)
    onStep?.('hashing');
    const evidenceHash = await computeEvidenceHash(evidence);

    // Step 4: Send to backend
    onStep?.('sending');
    const response = await signAdmissionDocument(documentId, {
      ...evidence,
      evidenceHash,
    });

    onStep?.('completed');

    return {
      documentId: response.documentId,
      signedFileId: response.signedFileId,
      hmac: response.hmac,
      padesSealed: response.padesSealed,
    };
  } catch (error: any) {
    onStep?.('error');

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
