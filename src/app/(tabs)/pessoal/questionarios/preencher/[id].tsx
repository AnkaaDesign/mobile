// app/(tabs)/pessoal/questionarios/preencher/[id].tsx
//
// Mobile self-fill flow: the logged-in user answers a questionnaire for
// themselves. Single column, generous tap targets, sticky save/submit bar.
//
// No data loss: every answer/comment change debounced-autosaves (suppressed
// toast) like the web fill page, and submit flushes any still-pending edits
// before sending. The local `answers` map is the source of truth while editing
// — it is seeded ONCE per entry (seedRef) so the autosave's list refetch can
// never clobber in-progress edits.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconArrowLeft, IconLoader2, IconSend } from "@tabler/icons-react-native";

import { useQuestionnaireEntryDetail, useQuestionnaireEntryMutations } from "@/hooks/useQuestionnaire";
import { QuestionCard } from "@/components/questionnaire/question-card";
import type { QuestionnaireEntry, QuestionnaireQuestion } from "@/types";

const SAVE_DEBOUNCE_MS = 500;

export default function FillQuestionnaireScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useQuestionnaireEntryDetail(id);
  const { upsertAnswersAsync, upsertAnswersSilentAsync, isAutosaving, submitAsync, isSubmitting } =
    useQuestionnaireEntryMutations(id ?? "");

  const entry = data?.data as QuestionnaireEntry | undefined;
  const isReadOnly = entry?.status === "SUBMITTED";

  const questions = useMemo(
    () => ((entry?.questions ?? []) as QuestionnaireQuestion[]).filter((q) => (q.options?.length ?? 0) > 0),
    [entry],
  );

  const [answers, setAnswers] = useState<Record<string, { value: number | null; comment: string }>>({});

  // Seed local answers from the entry ONCE per (entry, question-count). Without
  // this guard the autosave's "mine" invalidation -> detail refetch would
  // reseed mid-edit and discard the user's latest taps/typing.
  const seedRef = useRef("");
  useEffect(() => {
    if (!entry || questions.length === 0) return;
    const sig = `${entry.id}:${questions.length}`;
    if (seedRef.current === sig) return;
    seedRef.current = sig;
    const byQ = entry.answersByQuestion ?? {};
    const seed: Record<string, { value: number | null; comment: string }> = {};
    for (const q of questions) {
      const a = byQ[q.id];
      seed[q.id] = { value: a?.value ?? null, comment: a?.comment ?? "" };
    }
    setAnswers(seed);
  }, [entry, questions]);

  const answered = Object.values(answers).filter((a) => a.value != null).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  // ----- Debounced per-question autosave -----
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(
    (questionId: string, value: number | null, comment: string) => {
      if (!id || isReadOnly || value == null) return; // only answered questions are persistable
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        upsertAnswersSilentAsync({
          answers: [{ questionId, value, comment: comment.trim() ? comment.trim() : null }],
        }).catch(() => {
          /* toast via interceptor */
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [id, isReadOnly, upsertAnswersSilentAsync],
  );

  useEffect(() => () => saveTimer.current && clearTimeout(saveTimer.current), []);

  const handleValueChange = (questionId: string, value: number) => {
    const cur = answers[questionId] ?? { value: null, comment: "" };
    const next = { ...cur, value };
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    scheduleSave(questionId, value, next.comment);
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    const cur = answers[questionId] ?? { value: null, comment: "" };
    const next = { ...cur, comment };
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    scheduleSave(questionId, next.value, comment);
  };

  // Flush every answered question (used right before submit).
  const flushAll = useCallback(async () => {
    if (!id || isReadOnly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const payload = Object.entries(answers)
      .filter(([, a]) => a.value != null)
      .map(([questionId, a]) => ({
        questionId,
        value: a.value as number,
        comment: a.comment.trim() ? a.comment.trim() : null,
      }));
    if (payload.length) await upsertAnswersAsync({ answers: payload });
  }, [id, isReadOnly, answers, upsertAnswersAsync]);

  const handleSubmit = () => {
    if (answered !== total) {
      Alert.alert("Atenção", `Responda todas as perguntas antes de enviar (${answered}/${total}).`);
      return;
    }
    Alert.alert("Enviar questionário?", "Após o envio, as respostas não poderão ser alteradas.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Enviar",
        style: "default",
        onPress: async () => {
          try {
            await flushAll();
            await submitAsync();
            router.back();
          } catch {
            /* toast via interceptor */
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <IconArrowLeft size={22} color="#9ca3af" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-foreground" numberOfLines={1}>
          {entry?.questionnaire?.name ?? "Questionário"}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : !entry ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-muted-foreground">Questionário não encontrado.</Text>
        </View>
      ) : (
        <>
          <View className="border-b border-border px-4 py-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                {answered}/{total} respondidas ({pct}%)
              </Text>
              {!isReadOnly && isAutosaving ? (
                <View className="flex-row items-center gap-1">
                  <IconLoader2 size={12} color="#9ca3af" />
                  <Text className="text-[11px] text-muted-foreground">Salvando…</Text>
                </View>
              ) : null}
            </View>
            <View className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </View>
          </View>

          <ScrollView contentContainerClassName="gap-4 p-4 pb-28" keyboardShouldPersistTaps="handled">
            {questions.length === 0 ? (
              <View className="items-center justify-center py-16">
                <Text className="text-center text-sm text-muted-foreground">
                  Este questionário ainda não tem perguntas configuradas.
                </Text>
              </View>
            ) : (
              questions.map((q, idx) => {
                const a = answers[q.id] ?? { value: null, comment: "" };
                return (
                  <QuestionCard
                    key={q.id}
                    index={idx}
                    question={q}
                    options={q.options ?? []}
                    value={a.value}
                    comment={a.comment}
                    readOnly={isReadOnly}
                    onValueChange={(value) => handleValueChange(q.id, value)}
                    onCommentChange={(comment) => handleCommentChange(q.id, comment)}
                  />
                );
              })
            )}
          </ScrollView>

          {!isReadOnly && total > 0 && (
            <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-3">
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || answered !== total}
                className={`flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                  answered === total ? "bg-primary" : "bg-muted"
                }`}
              >
                <IconSend size={18} color="#ffffff" />
                <Text className="font-semibold text-white">{isSubmitting ? "Enviando…" : "Enviar"}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
