// packages/interfaces/src/vacation.ts
// Férias (Departamento Pessoal) — Part C. Mirrors api vacation module.

import type {
  BaseEntity,
  BaseGetUniqueResponse,
  BaseGetManyResponse,
  BaseCreateResponse,
  BaseUpdateResponse,
  BaseDeleteResponse,
  BaseBatchResponse,
} from "./common";
import type { VACATION_STATUS } from "@/constants";
import type { User } from "./user";

// =====================
// Entities
// =====================

export interface Vacation extends BaseEntity {
  // userId stays non-null to mirror the API vacation type (and the create-form
  // base type); the Prisma column is nullable only for soft-deleted/orphan rows.
  userId: string;
  contractId: string | null;
  // Férias coletivas: vínculo opcional ao grupo que originou este registro individual.
  groupId: string | null;
  deletedAt?: Date | null;
  acquisitiveStart: Date;
  acquisitiveEnd: Date;
  concessiveEnd: Date | null;
  unjustifiedAbsencesInPeriod: number;
  entitledDays: number;
  // Single-period gozo "taking": startDate is null while not scheduled, days is
  // the gozo days of THIS taking. Multiple Vacation rows may share an acquisitive
  // period; remaining gozo days are computed by grouping siblings.
  startDate?: Date | null;
  days: number;
  status: VACATION_STATUS;
  abonoPecuniarioDays: number;
  soldThird: boolean;
  baseRemuneration: number | null;
  oneThird: number | null;
  abonoAmount: number | null;
  inss: number | null;
  irrf: number | null;
  isDouble: boolean;
  paymentDueDate: Date | null;
  paymentDate: Date | null;
  notes: string | null;

  // Relations
  user?: User;
  contract?: any;
  // Férias coletivas: grupo que originou este registro individual (quando expandido).
  group?: any;
}

// =====================
// Period balance (remaining-days history across sibling takings)
// =====================

export interface VacationPeriodTaking {
  id: string;
  startDate: Date | null;
  days: number;
  status: VACATION_STATUS;
}

export interface VacationPeriodBalance {
  entitledDays: number;
  abonoDays: number;
  gozoEntitled: number;
  scheduledDays: number;
  remainingDays: number;
  takings: VacationPeriodTaking[];
}

export type VacationPeriodBalanceResponse = BaseGetUniqueResponse<VacationPeriodBalance>;

// =====================
// Recibo (payable férias receipt) — NOT embedded in the monthly folha
// =====================

export interface VacationReciboLine {
  /** Provento (>0) ou desconto (<0). */
  label: string;
  amount: number;
}

export interface VacationRecibo {
  vacationId: string;
  userId: string;
  /** Dias gozados (entitled - abono). */
  vacationDays: number;
  abonoPecuniarioDays: number;
  /** Base de cálculo das férias (remuneração + média de variáveis). */
  baseRemuneration: number;
  oneThird: number;
  abonoAmount: number;
  /** Terço sobre o abono (verba indenizatória, isenta). */
  abonoOneThird: number;
  isDouble: boolean;
  taxableBase: number;
  inss: number;
  irrf: number;
  earnings: number;
  discounts: number;
  /** Líquido a receber no recibo de férias. */
  net: number;
  lines: VacationReciboLine[];
}

// =====================
// Responses
// =====================

export type VacationGetUniqueResponse = BaseGetUniqueResponse<Vacation>;
export type VacationGetManyResponse = BaseGetManyResponse<Vacation>;
export type VacationCreateResponse = BaseCreateResponse<Vacation>;
export type VacationUpdateResponse = BaseUpdateResponse<Vacation>;
export type VacationDeleteResponse = BaseDeleteResponse;
export type VacationBatchCreateResponse<T> = BaseBatchResponse<Vacation, T>;
export type VacationBatchUpdateResponse<T> = BaseBatchResponse<Vacation, T>;
export type VacationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
export type VacationCalculateResponse = BaseGetUniqueResponse<{ vacation: Vacation; recibo: VacationRecibo }>;
