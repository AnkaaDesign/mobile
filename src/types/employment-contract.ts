// packages/interfaces/src/employment-contract.ts
// Vínculos empregatícios (EmploymentContract)

import type {
  BaseEntity,
  BaseGetUniqueResponse,
  BaseGetManyResponse,
  BaseCreateResponse,
  BaseUpdateResponse,
  BaseDeleteResponse,
  BaseBatchResponse,
} from "./common";
import type { ORDER_BY_DIRECTION, CONTRACT_TYPE, CONTRACT_STATUS, EMPLOYEE_TYPE, TERMINATION_TYPE, INSALUBRITY_DEGREE, STABILITY_TYPE } from "@/constants";
import type { User, UserIncludes } from "./user";

// =====================
// Contract Phase History
// =====================

/**
 * Audit row recording each MODALITY (CONTRACT_TYPE) a contract held over time.
 * The single continuous vínculo advances EXPERIENCE_PERIOD_1 → EXPERIENCE_PERIOD_2
 * → INDETERMINATE on dates. `endDate === null` means the phase is current/open.
 */
export interface ContractPhaseHistory extends BaseEntity {
  contractId: string;
  userId: string;
  contractType: CONTRACT_TYPE;
  startDate: Date;
  endDate: Date | null;
  triggeredBy?: string | null;
  reason?: string | null;
}

// =====================
// Main Entity Interface
// =====================

export interface EmploymentContract extends BaseEntity {
  userId: string;
  sequence: number;
  matricula: number | null;
  payrollNumber: number | null;
  employeeType: EMPLOYEE_TYPE;
  contractType: CONTRACT_TYPE | null;
  status: CONTRACT_STATUS;
  statusOrder: number;
  positionId: string | null;
  sectorId: string | null;
  /** Per-vínculo override do grau de insalubridade do cargo. NULL = herda do Position. */
  insalubrityDegreeOverride: INSALUBRITY_DEGREE | null;
  /** Per-vínculo override da periculosidade do cargo. NULL = herda do Position. */
  hazardPayOverride: boolean | null;
  admissionDate: Date | null;
  exp1StartAt: Date | null;
  exp1EndAt: Date | null;
  exp2StartAt: Date | null;
  exp2EndAt: Date | null;
  effectedAt: Date | null;
  /** Art. 481 CLT — cláusula assecuratória do direito recíproco de rescisão. */
  hasArt481Clause: boolean;
  terminationDate: Date | null;
  terminationType: TERMINATION_TYPE | null;
  /** Tipo de estabilidade (estabilidade) que bloqueia o desligamento. NULL = sem estabilidade. */
  stabilityType: STABILITY_TYPE | null;
  stabilityStart: Date | null;
  stabilityEnd: Date | null;
  providerName: string | null;
  providerCnpj: string | null;
  notes: string | null;
  isCurrent: boolean;

  // Relations (optional, populated based on query)
  user?: User;
  position?: any;
  sector?: any;
  admission?: any;
  terminations?: any[];
  payrolls?: any[];
  phaseHistory?: ContractPhaseHistory[];
}

// =====================
// Include Types
// =====================

export interface EmploymentContractIncludes {
  user?: boolean | { include?: UserIncludes };
  position?: boolean | { include?: any };
  sector?: boolean | { include?: any };
  admission?: boolean | { include?: any };
  terminations?: boolean | { include?: any };
  payrolls?: boolean | { include?: any };
  phaseHistory?: boolean | { include?: any; orderBy?: any };
}

// =====================
// Order By Types
// =====================

export interface EmploymentContractOrderBy {
  id?: ORDER_BY_DIRECTION;
  userId?: ORDER_BY_DIRECTION;
  sequence?: ORDER_BY_DIRECTION;
  matricula?: ORDER_BY_DIRECTION;
  payrollNumber?: ORDER_BY_DIRECTION;
  employeeType?: ORDER_BY_DIRECTION;
  contractType?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  admissionDate?: ORDER_BY_DIRECTION;
  effectedAt?: ORDER_BY_DIRECTION;
  terminationDate?: ORDER_BY_DIRECTION;
  isCurrent?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

// =====================
// Response Interfaces
// =====================

export type EmploymentContractGetUniqueResponse = BaseGetUniqueResponse<EmploymentContract>;
export type EmploymentContractGetManyResponse = BaseGetManyResponse<EmploymentContract>;
export type EmploymentContractCreateResponse = BaseCreateResponse<EmploymentContract>;
export type EmploymentContractUpdateResponse = BaseUpdateResponse<EmploymentContract>;
export type EmploymentContractDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type EmploymentContractBatchCreateResponse<T> = BaseBatchResponse<EmploymentContract, T>;
export type EmploymentContractBatchUpdateResponse<T> = BaseBatchResponse<EmploymentContract, T & { id: string }>;
export type EmploymentContractBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
