import type { BiometricMethod, NetworkType } from '@/types/ppe';

export type WarningSigningStep =
  | 'idle'
  | 'requesting_consent'
  | 'requesting_biometric'
  | 'collecting_evidence'
  | 'hashing'
  | 'sending'
  | 'completed'
  | 'error';

export interface WarningEvidencePayload {
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

export interface WarningSigningState {
  step: WarningSigningStep;
  error: string | null;
  signatureId: string | null;
  hmac: string | null;
  signerRole: 'COLLABORATOR' | 'WITNESS' | null;
}

export const INITIAL_WARNING_SIGNING_STATE: WarningSigningState = {
  step: 'idle',
  error: null,
  signatureId: null,
  hmac: null,
  signerRole: null,
};

export const WARNING_SIGNING_STEP_LABELS: Record<WarningSigningStep, string> = {
  idle: '',
  requesting_consent: 'Solicitando consentimento...',
  requesting_biometric: 'Autenticação biométrica...',
  collecting_evidence: 'Coletando evidências...',
  hashing: 'Gerando hash de segurança...',
  sending: 'Registrando assinatura...',
  completed: 'Assinatura concluída!',
  error: 'Erro na assinatura',
};
