// packages/interfaces/src/warning.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { WARNING_CATEGORY, WARNING_SEVERITY, ORDER_BY_DIRECTION } from '@/constants';
import type { User, UserIncludes, UserOrderBy } from "./user";
import type { File, FileIncludes } from "./file";
import type { BiometricMethod, NetworkType } from "./ppe";

// =====================
// Warning Signature Types
// =====================

export type WarningSignerRole = "COLLABORATOR" | "WITNESS";

export interface WarningSignature extends BaseEntity {
  warningId: string;
  signedByUserId: string | null;
  // CPF of the signer captured at signing time (collaborator or witness).
  signedByCpf: string | null;
  signerRole: WarningSignerRole;
  // True when this record represents a refusal-to-sign (registered by HR/supervisor).
  refused: boolean;
  refusedReason: string | null;
  // Who registered the signature/refusal (the logged-in user that performed it).
  registeredById: string | null;

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
  ipAddress: string | null;
  clientTimestamp: Date;
  serverTimestamp: Date;
  evidenceHash: string;
  hmacSignature: string;
  signedDocumentId: string | null;
  consentGiven: boolean;

  // PAdES seal (ICP-Brasil cert applied server-side over the signed PDF)
  padesSealed?: boolean;
  padesSealedAt?: Date | null;
  certSubject?: string | null;
  certCnpj?: string | null;

  // Relations
  signedByUser?: Pick<User, "id" | "name"> | User;
  registeredBy?: Pick<User, "id" | "name"> | User;
  signedDocument?: {
    id: string;
    filename?: string;
    originalName?: string;
    mimetype?: string;
    path?: string;
    size?: number;
  } | null;
}

export type WarningSignatureEvent = WarningSignature;

// =====================
// Main Entity Interface
// =====================

export interface Warning extends BaseEntity {
  severity: WARNING_SEVERITY;
  severityOrder: number; // 1=Verbal, 2=Escrita, 3=Suspensão, 4=Advertência Final
  category: WARNING_CATEGORY;
  reason: string;
  description: string | null;
  isActive: boolean;
  collaboratorId: string;
  supervisorId: string;
  // Dias de suspensão (severity = SUSPENSION). CLT art. 474 limita a 30 dias.
  suspensionDays: number | null;
  // Rescisão por justa causa que esta advertência fundamenta (opcional).
  terminationId: string | null;
  followUpDate: Date;
  hrNotes: string | null;
  resolvedAt: Date | null;

  // Auto-resolution flags
  autoResolve: boolean;
  autoResolved: boolean;

  // Relations (optional, populated based on query)
  collaborator?: User;
  supervisor?: User;
  witness?: User[];
  attachments?: File[];
  // Electronic signatures (collaborator + witnesses + any refusal). Returned by
  // GET /warnings/:id by default.
  signatures?: WarningSignature[];
}

// =====================
// Include Types
// =====================

export interface WarningIncludes {
  collaborator?:
    | boolean
    | {
        include?: UserIncludes;
      };
  supervisor?:
    | boolean
    | {
        include?: UserIncludes;
      };
  witness?:
    | boolean
    | {
        include?: UserIncludes;
      };
  attachments?:
    | boolean
    | {
        include?: FileIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface WarningOrderBy {
  id?: ORDER_BY_DIRECTION;
  severity?: ORDER_BY_DIRECTION;
  category?: ORDER_BY_DIRECTION;
  reason?: ORDER_BY_DIRECTION;
  description?: ORDER_BY_DIRECTION;
  isActive?: ORDER_BY_DIRECTION;
  followUpDate?: ORDER_BY_DIRECTION;
  hrNotes?: ORDER_BY_DIRECTION;
  resolvedAt?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  collaboratorId?: ORDER_BY_DIRECTION;
  supervisorId?: ORDER_BY_DIRECTION;
  collaborator?: UserOrderBy;
  supervisor?: UserOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type WarningGetUniqueResponse = BaseGetUniqueResponse<Warning>;
export type WarningGetManyResponse = BaseGetManyResponse<Warning>;
export type WarningCreateResponse = BaseCreateResponse<Warning>;
export type WarningUpdateResponse = BaseUpdateResponse<Warning>;
export type WarningDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type WarningBatchCreateResponse<T = any> = BaseBatchResponse<Warning, T>;
export type WarningBatchUpdateResponse<T = any> = BaseBatchResponse<Warning, T & { id: string }>;
export type WarningBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
