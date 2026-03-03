import type { BiometricMethod, NetworkType } from '@/types/ppe';

export type PpeSigningStep =
  | 'idle'
  | 'requesting_consent'
  | 'requesting_biometric'
  | 'collecting_evidence'
  | 'hashing'
  | 'sending'
  | 'completed'
  | 'error';

export interface PpeEvidencePayload {
  biometricMethod: BiometricMethod;
  biometricSuccess: boolean;
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceOs: string | null;
  deviceOsVersion: string | null;
  appVersion: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  networkType: NetworkType;
  clientTimestamp: string; // ISO 8601
  consentGiven: boolean;
}

export interface PpeSigningState {
  step: PpeSigningStep;
  error: string | null;
  signatureId: string | null;
  hmac: string | null;
}

export const INITIAL_SIGNING_STATE: PpeSigningState = {
  step: 'idle',
  error: null,
  signatureId: null,
  hmac: null,
};

export const PPE_SIGNING_STEP_LABELS: Record<PpeSigningStep, string> = {
  idle: '',
  requesting_consent: 'Solicitando consentimento...',
  requesting_biometric: 'Autenticação biométrica...',
  collecting_evidence: 'Coletando evidências...',
  hashing: 'Gerando hash de segurança...',
  sending: 'Enviando assinatura...',
  completed: 'Assinatura concluída!',
  error: 'Erro na assinatura',
};
