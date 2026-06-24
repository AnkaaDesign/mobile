/**
 * Warning In-App Signing Service
 *
 * Orchestrates the full signing flow for "Advertência" (Warning):
 * 1. Biometric authentication (only for the collaborator/witness signature)
 * 2. Evidence collection (device, location, network)
 * 3. SHA-256 hash computation
 * 4. POST to backend /warnings/:id/sign (or /refuse-signature)
 *
 * The biometric/device/location/network evidence collectors and the
 * SHA-256 hashing are entity-agnostic and reused from the PPE signing
 * service. The API infers the signer role (COLLABORATOR vs WITNESS) from
 * the logged-in user — the mobile UI never sends the role.
 */

import * as Crypto from 'expo-crypto';
import {
  authenticateWithBiometric,
  collectDeviceInfo,
  collectLocationInfo,
  collectNetworkInfo,
} from '@/services/ppe-signing/collect-evidence';
import type { WarningSigningStep, WarningEvidencePayload } from './types';
import { WarningSigningService } from '@/api-client/warning';
import type { BiometricMethod } from '@/types/ppe';

export interface SignWarningResult {
  signatureId: string;
  hmac: string;
  signerRole: 'COLLABORATOR' | 'WITNESS';
}

export interface RefuseWarningResult {
  signatureId: string;
}

/**
 * Collect all evidence in parallel for speed.
 * Returns the full evidence payload ready for hashing.
 */
async function collectAllEvidence(
  biometricResult: { success: boolean; method: BiometricMethod },
): Promise<WarningEvidencePayload> {
  const [deviceInfo, locationInfo, networkType] = await Promise.all([
    Promise.resolve(collectDeviceInfo()),
    collectLocationInfo(),
    collectNetworkInfo(),
  ]);

  return {
    biometricMethod: biometricResult.method,
    biometricSuccess: biometricResult.success,
    ...deviceInfo,
    ...locationInfo,
    networkType,
    clientTimestamp: new Date().toISOString(),
    consentGiven: true,
  };
}

/**
 * Compute SHA-256 hash of the evidence payload.
 * This must match the server-side hash computation.
 */
async function computeEvidenceHash(evidence: WarningEvidencePayload): Promise<string> {
  const payload = JSON.stringify({
    biometricMethod: evidence.biometricMethod,
    biometricSuccess: evidence.biometricSuccess,
    deviceBrand: evidence.deviceBrand,
    deviceModel: evidence.deviceModel,
    deviceOs: evidence.deviceOs,
    deviceOsVersion: evidence.deviceOsVersion,
    appVersion: evidence.appVersion,
    latitude: evidence.latitude ?? null,
    longitude: evidence.longitude ?? null,
    locationAccuracy: evidence.locationAccuracy ?? null,
    networkType: evidence.networkType,
    clientTimestamp: evidence.clientTimestamp,
    consentGiven: evidence.consentGiven,
  });

  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

/**
 * Sign a warning with biometric evidence.
 *
 * Works for BOTH the collaborator and a witness — the API infers the role
 * from the logged-in user. Biometric success is REQUIRED.
 *
 * @param warningId - The warning UUID to sign
 * @param onStep - Callback for UI progress updates
 * @returns The signature result with signatureId, HMAC and signerRole
 * @throws Error with user-friendly Portuguese message on failure
 */
export async function signWarning(
  warningId: string,
  onStep?: (step: WarningSigningStep) => void,
): Promise<SignWarningResult> {
  try {
    // Step 1: Biometric authentication
    onStep?.('requesting_biometric');

    const biometricResult = await authenticateWithBiometric(
      'Confirme sua identidade para assinar a advertência',
    );

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
    const response = await WarningSigningService.signWarning(warningId, {
      ...evidence,
      evidenceHash,
    });

    onStep?.('completed');

    return {
      signatureId: response.signatureId,
      hmac: response.hmac,
      signerRole: response.signerRole,
    };
  } catch (error: any) {
    onStep?.('error');

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

/**
 * Register that the COLLABORATOR refused to sign the warning.
 *
 * Operated by a supervisor/HR user. Does NOT require biometric success —
 * device evidence is still collected for the audit trail. The API rejects
 * with 400 when the warning has fewer than 2 witnesses.
 *
 * @param warningId - The warning UUID
 * @param refusedReason - Reason the collaborator refused (min 1 char)
 * @param onStep - Callback for UI progress updates
 * @throws Error with user-friendly Portuguese message on failure
 */
export async function refuseWarningSignature(
  warningId: string,
  refusedReason: string,
  onStep?: (step: WarningSigningStep) => void,
): Promise<RefuseWarningResult> {
  try {
    // No biometric requirement — collect device/location/network evidence only.
    onStep?.('collecting_evidence');
    const evidence = await collectAllEvidence({ success: false, method: 'NONE' });

    onStep?.('hashing');
    const evidenceHash = await computeEvidenceHash(evidence);

    onStep?.('sending');
    const response = await WarningSigningService.refuseWarningSignature(warningId, {
      ...evidence,
      evidenceHash,
      refusedReason,
    });

    onStep?.('completed');

    return { signatureId: response.signatureId };
  } catch (error: any) {
    onStep?.('error');

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
