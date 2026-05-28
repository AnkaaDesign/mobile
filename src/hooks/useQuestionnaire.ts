// hooks/useQuestionnaire.ts
//
// Self-fill questionnaire hooks (mobile). Toasts handled by the axios/notify
// interceptor.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getQuestionnaireEntries,
  getQuestionnaireEntryById,
  upsertQuestionnaireEntryAnswers,
  submitQuestionnaireEntry,
} from "@/api-client";
import type {
  QuestionnaireEntryGetManyParams,
  QuestionnaireEntryAnswersUpsertFormData,
} from "@/types";

export const questionnaireEntryKeys = {
  all: ["questionnaire-entry"] as const,
  list: (filters?: any) => ["questionnaire-entry", "list", filters ?? {}] as const,
  detail: (id: string) => ["questionnaire-entry", "detail", id] as const,
  mine: () => ["questionnaire-entry", "me"] as const,
};

/** The logged-in user's questionnaire queue (all statuses). */
export function useMyQuestionnaireEntries(params?: Partial<QuestionnaireEntryGetManyParams> & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params ?? {};
  return useQuery({
    queryKey: questionnaireEntryKeys.mine(),
    queryFn: () =>
      getQuestionnaireEntries({
        respondentId: "me",
        include: { questionnaire: true, _count: { select: { answers: true } } },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        limit: 100,
        ...rest,
      }),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useQuestionnaireEntryDetail(id: string | undefined, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: questionnaireEntryKeys.detail(id ?? ""),
    queryFn: () => getQuestionnaireEntryById(id as string),
    enabled: (opts?.enabled ?? true) && !!id,
    staleTime: 1000 * 30,
  });
}

export function useQuestionnaireEntryMutations(entryId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: questionnaireEntryKeys.detail(entryId) });
    qc.invalidateQueries({ queryKey: questionnaireEntryKeys.mine() });
  };

  // Visible upsert (used by the manual "Salvar"/submit flush): toasts + invalidates.
  const upsert = useMutation({
    mutationFn: (data: QuestionnaireEntryAnswersUpsertFormData) => upsertQuestionnaireEntryAnswers(entryId, data),
    onSuccess: invalidate,
  });

  // Silent upsert (debounced autosave): no toast, no detail invalidation so it
  // never clobbers the user's in-progress local edits while they keep typing.
  // Only the list ("mine") is invalidated so the queue reflects IN_PROGRESS.
  const upsertSilent = useMutation({
    mutationFn: (data: QuestionnaireEntryAnswersUpsertFormData) =>
      upsertQuestionnaireEntryAnswers(entryId, data, { suppressToast: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionnaireEntryKeys.mine() });
    },
  });

  const submit = useMutation({
    mutationFn: () => submitQuestionnaireEntry(entryId),
    onSuccess: invalidate,
  });

  return {
    upsertAnswers: upsert.mutate,
    upsertAnswersAsync: upsert.mutateAsync,
    upsertAnswersSilentAsync: upsertSilent.mutateAsync,
    isUpserting: upsert.isPending,
    isAutosaving: upsertSilent.isPending,
    submit: submit.mutate,
    submitAsync: submit.mutateAsync,
    isSubmitting: submit.isPending,
  };
}
