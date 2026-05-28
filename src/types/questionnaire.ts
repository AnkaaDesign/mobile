// types/questionnaire.ts
//
// Self-fill Questionnaire domain types (mobile). Only the surface the mobile
// self-fill flow needs — admins manage questionnaires on the web.

import type { BaseGetUniqueResponse, BaseGetManyResponse } from "./common";

export type QuestionnaireStatus = "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";
export type QuestionnaireEntryStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED";

export interface QuestionnaireOption {
  id: string;
  questionId: string;
  order: number;
  value: number;
  label: string;
  description?: string | null;
}

export interface QuestionnaireQuestion {
  id: string;
  groupId: string;
  order: number;
  title: string;
  description: string;
  helpText?: string | null;
  group?: { id: string; name: string } | null;
  options?: QuestionnaireOption[];
}

export interface Questionnaire {
  id: string;
  name: string;
  description?: string | null;
  periodStart: Date | string;
  periodEnd: Date | string;
  status: QuestionnaireStatus;
}

export interface QuestionnaireAnswer {
  id: string;
  entryId: string;
  questionId: string;
  value: number;
  comment?: string | null;
}

export interface QuestionnaireEntry {
  id: string;
  questionnaireId: string;
  respondentId: string;
  status: QuestionnaireEntryStatus;
  startedAt?: Date | string | null;
  submittedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  questionnaire?: Questionnaire;
  respondent?: { id: string; name: string; sector?: { name: string } | null; position?: { name: string } | null };
  answers?: QuestionnaireAnswer[];
  // injected by GET /questionnaire-entry/:id
  questions?: QuestionnaireQuestion[];
  answersByQuestion?: Record<string, QuestionnaireAnswer>;
  _count?: { answers?: number };
}

// ----- Form data -----
export interface QuestionnaireAnswerFormData {
  questionId: string;
  value: number;
  comment?: string | null;
}
export interface QuestionnaireEntryAnswersUpsertFormData {
  answers: QuestionnaireAnswerFormData[];
}

export interface QuestionnaireEntryGetManyParams {
  page?: number;
  limit?: number;
  include?: any;
  orderBy?: any;
  status?: QuestionnaireEntryStatus | QuestionnaireEntryStatus[];
  respondentId?: string | "me";
}
export interface QuestionnaireEntryQueryParams {
  include?: any;
}

// ----- Responses -----
export type QuestionnaireEntryGetUniqueResponse = BaseGetUniqueResponse<QuestionnaireEntry>;
export type QuestionnaireEntryGetManyResponse = BaseGetManyResponse<QuestionnaireEntry>;
