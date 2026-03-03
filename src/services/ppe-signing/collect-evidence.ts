/**
 * PPE Signing — Evidence Collection
 *
 * Collects device, biometric, location, and network evidence for
 * in-app PPE delivery signature. LGPD compliant: stores only
 * biometric result (not raw data), rounds GPS to ~11m accuracy.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import type { BiometricMethod, NetworkType } from '@/types/ppe';
import type { PpeEvidencePayload } from './types';

/**
 * Authenticate user with device biometrics (FaceID / fingerprint / PIN fallback).
 * Returns the method used and whether it succeeded.
 * Never accesses raw biometric data — only the boolean result.
 */
export async function authenticateWithBiometric(): Promise<{
  success: boolean;
  method: BiometricMethod;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return { success: false, method: 'NONE' };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    return { success: false, method: 'NONE' };
  }

  // Determine available biometric type
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  let method: BiometricMethod = 'DEVICE_PIN';
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    method = 'FACE_ID';
  } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    method = 'FINGERPRINT';
  } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    method = 'IRIS';
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirme sua identidade para assinar a entrega de EPI',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar senha',
    disableDeviceFallback: false,
  });

  return {
    success: result.success,
    method: result.success ? method : 'NONE',
  };
}

/**
 * Collect device information via expo-device + expo-constants.
 */
export function collectDeviceInfo(): {
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceOs: string | null;
  deviceOsVersion: string | null;
  appVersion: string | null;
} {
  return {
    deviceBrand: Device.brand,
    deviceModel: Device.modelName,
    deviceOs: Device.osName,
    deviceOsVersion: Device.osVersion,
    appVersion: Constants.expoConfig?.version || null,
  };
}

/**
 * Collect location with foreground permission.
 * Returns null values if permission is denied — signing still works without location.
 * GPS is rounded to 4 decimal places on the server for LGPD minimization.
 */
export async function collectLocationInfo(): Promise<{
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { latitude: null, longitude: null, locationAccuracy: null };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      locationAccuracy: location.coords.accuracy,
    };
  } catch {
    return { latitude: null, longitude: null, locationAccuracy: null };
  }
}

/**
 * Collect network type via @react-native-community/netinfo.
 */
export async function collectNetworkInfo(): Promise<NetworkType> {
  try {
    const state = await NetInfo.fetch();
    switch (state.type) {
      case 'wifi':
        return 'WIFI';
      case 'cellular':
        return 'CELLULAR';
      case 'ethernet':
        return 'ETHERNET';
      default:
        return 'UNKNOWN';
    }
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Collect all evidence in parallel for speed.
 * Returns the full evidence payload ready for hashing.
 */
export async function collectAllEvidence(
  biometricResult: { success: boolean; method: BiometricMethod },
): Promise<PpeEvidencePayload> {
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
export async function computeEvidenceHash(evidence: PpeEvidencePayload): Promise<string> {
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

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload,
  );

  return hash;
}
