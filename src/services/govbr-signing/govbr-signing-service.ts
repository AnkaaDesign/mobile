import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { apiClient } from '@/api-client/axiosClient';
import { authenticateWithGovbr } from './govbr-auth';
import {
  GovbrEnvironment,
  SignDocumentResponse,
  GetCertificateResponse,
} from './types';

export async function hashDocument(fileUri: string): Promise<string> {
  const base64Content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64Content,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );

  return hash;
}

export async function signDocument(
  code: string,
  hashBase64: string,
  environment: GovbrEnvironment,
): Promise<SignDocumentResponse> {
  const response = await apiClient.post<SignDocumentResponse>(
    '/govbr/sign',
    { code, hashBase64, environment },
  );

  return response.data;
}

export async function getCertificate(
  code: string,
  environment: GovbrEnvironment,
): Promise<GetCertificateResponse> {
  const response = await apiClient.post<GetCertificateResponse>(
    '/govbr/certificate',
    { code, environment },
  );

  return response.data;
}

export async function authenticateAndSign(
  fileUri: string,
  environment: GovbrEnvironment,
  onStep: (step: string) => void,
): Promise<{ signature: string; signedAt: string; hashBase64: string }> {
  onStep('hashing');
  const hashBase64 = await hashDocument(fileUri);

  onStep('authenticating');
  const { code } = await authenticateWithGovbr(environment);

  onStep('signing');
  const result = await signDocument(code, hashBase64, environment);

  return {
    signature: result.data.signature,
    signedAt: result.data.signedAt,
    hashBase64,
  };
}
