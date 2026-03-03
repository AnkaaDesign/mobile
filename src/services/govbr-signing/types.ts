export type SigningStep =
  | 'idle'
  | 'picking_document'
  | 'hashing'
  | 'authenticating'
  | 'signing'
  | 'completed'
  | 'error';

export type GovbrEnvironment = 'staging' | 'production';

export interface DocumentInfo {
  uri: string;
  name: string;
  size: number;
}

export interface SigningState {
  step: SigningStep;
  document: DocumentInfo | null;
  hashBase64: string | null;
  signature: string | null;
  signedAt: string | null;
  error: string | null;
}

export interface SignDocumentResponse {
  success: true;
  data: {
    signature: string;
    signedAt: string;
  };
}

export interface GetCertificateResponse {
  success: true;
  data: {
    certificate: string;
    subjectDN?: string;
    issuerDN?: string;
    notBefore?: string;
    notAfter?: string;
  };
}

export const INITIAL_SIGNING_STATE: SigningState = {
  step: 'idle',
  document: null,
  hashBase64: null,
  signature: null,
  signedAt: null,
  error: null,
};
