// api-client/questionnaire-entry.ts
//
// Self-fill QuestionnaireEntry endpoints (mobile). Admins manage questionnaires
// on the web; mobile only fills entries for the logged-in user.

import { apiClient } from "./axiosClient";
import type {
  QuestionnaireEntryGetManyParams,
  QuestionnaireEntryQueryParams,
  QuestionnaireEntryAnswersUpsertFormData,
  QuestionnaireEntryGetManyResponse,
  QuestionnaireEntryGetUniqueResponse,
} from "../types";

export class QuestionnaireEntryService {
  private readonly basePath = "/questionnaire-entry";

  async getEntries(params?: QuestionnaireEntryGetManyParams): Promise<QuestionnaireEntryGetManyResponse> {
    const response = await apiClient.get<QuestionnaireEntryGetManyResponse>(this.basePath, { params });
    return response.data;
  }

  async getEntryById(id: string, params?: QuestionnaireEntryQueryParams): Promise<QuestionnaireEntryGetUniqueResponse> {
    const response = await apiClient.get<QuestionnaireEntryGetUniqueResponse>(`${this.basePath}/${id}`, { params });
    return response.data;
  }

  async upsertAnswers(
    entryId: string,
    data: QuestionnaireEntryAnswersUpsertFormData,
    options?: { suppressToast?: boolean },
  ): Promise<QuestionnaireEntryGetUniqueResponse> {
    const config = options?.suppressToast ? ({ metadata: { suppressToast: true } } as any) : undefined;
    const response = await apiClient.put<QuestionnaireEntryGetUniqueResponse>(
      `${this.basePath}/${entryId}/answers`,
      data,
      config,
    );
    return response.data;
  }

  async submitEntry(id: string): Promise<QuestionnaireEntryGetUniqueResponse> {
    const response = await apiClient.post<QuestionnaireEntryGetUniqueResponse>(`${this.basePath}/${id}/submit`);
    return response.data;
  }
}

export const questionnaireEntryService = new QuestionnaireEntryService();

export const getQuestionnaireEntries = (params?: QuestionnaireEntryGetManyParams) =>
  questionnaireEntryService.getEntries(params);
export const getQuestionnaireEntryById = (id: string, params?: QuestionnaireEntryQueryParams) =>
  questionnaireEntryService.getEntryById(id, params);
export const upsertQuestionnaireEntryAnswers = (
  id: string,
  data: QuestionnaireEntryAnswersUpsertFormData,
  options?: { suppressToast?: boolean },
) => questionnaireEntryService.upsertAnswers(id, data, options);
export const submitQuestionnaireEntry = (id: string) => questionnaireEntryService.submitEntry(id);
