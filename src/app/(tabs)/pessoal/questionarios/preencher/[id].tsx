// app/(tabs)/pessoal/questionarios/preencher/[id].tsx
//
// Mobile self-fill flow — ONE question at a time, mirroring the web fill page:
//   • a spaced stepper card with prev/next chevrons and a tappable centre
//     (title + X/Y, with press feedback) that opens a bottom-sheet question picker;
//   • the active question rendered via <QuestionCard/>;
//   • picking a score autosaves (debounced, silent) — it does NOT auto-advance;
//   • the Enviar action bar appears ONLY on the last question, clear of the
//     home indicator (safe-area inset).
//
// No data loss: every change debounced-autosaves and submit flushes pending
// edits first. `answers` is the source of truth while editing, seeded ONCE per
// entry (seedRef) so the autosave's refetch can't clobber edits.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { IconChevronLeft, IconChevronRight, IconCheck, IconX } from "@tabler/icons-react-native";

import { useQuestionnaireEntryDetail, useQuestionnaireEntryMutations } from "@/hooks/useQuestionnaire";
import { QuestionCard } from "@/components/questionnaire/question-card";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { FormActionBar } from "@/components/forms/FormActionBar";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import type { QuestionnaireEntry, QuestionnaireQuestion } from "@/types";

const SAVE_DEBOUNCE_MS = 500;

export default function FillQuestionnaireScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { data, isLoading } = useQuestionnaireEntryDetail(id);
  const { upsertAnswersAsync, upsertAnswersSilentAsync, submitAsync, isSubmitting } =
    useQuestionnaireEntryMutations(id ?? "");

  const entry = data?.data as QuestionnaireEntry | undefined;
  const isReadOnly = entry?.status === "SUBMITTED";

  // Drive the native (Drawer) header title — overrides the static route→title map.
  useEffect(() => {
    navigation.setOptions({ headerTitle: entry?.questionnaire?.name ?? "Questionário" });
  }, [navigation, entry?.questionnaire?.name]);

  const questions = useMemo(
    () => ((entry?.questions ?? []) as QuestionnaireQuestion[]).filter((q) => (q.options?.length ?? 0) > 0),
    [entry],
  );

  const [answers, setAnswers] = useState<Record<string, { value: number | null; comment: string }>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Seed local answers ONCE per (entry, question-count).
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

  const total = questions.length;
  const answered = Object.values(answers).filter((a) => a.value != null).length;
  // Clamp the rendered index so the count, chevrons and content can never disagree
  // (e.g. after returning to the screen or when the question set changes).
  const safeIndex = total > 0 ? Math.min(Math.max(activeIndex, 0), total - 1) : 0;
  const active = questions[safeIndex] ?? null;
  const activeAnswer = active ? answers[active.id] ?? { value: null, comment: "" } : null;

  // Start at the first step whenever a different entry is opened.
  useEffect(() => {
    setActiveIndex(0);
  }, [id]);

  // Scroll back to top whenever the active question changes (manual navigation).
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [safeIndex]);

  const goTo = useCallback((i: number) => setActiveIndex(Math.max(0, Math.min(total - 1, i))), [total]);

  // ----- Debounced per-question autosave (no auto-advance) -----
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(
    (questionId: string, value: number | null, comment: string) => {
      if (!id || isReadOnly || value == null) return;
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

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handleValueChange = (questionId: string, value: number) => {
    const cur = answers[questionId] ?? { value: null, comment: "" };
    setAnswers((prev) => ({ ...prev, [questionId]: { ...cur, value } }));
    scheduleSave(questionId, value, cur.comment);
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    const cur = answers[questionId] ?? { value: null, comment: "" };
    setAnswers((prev) => ({ ...prev, [questionId]: { ...cur, comment } }));
    scheduleSave(questionId, cur.value, comment);
  };

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

  const showSubmit = !isReadOnly && total > 0 && safeIndex === total - 1;
  const mutedTrack = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !entry ? (
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: "center" }}>
            Questionário não encontrado.
          </Text>
        </View>
      ) : (
        <>
          {/* Stepper card (spaced from the screen edges). The paddingBottom keeps a
              persistent gap so scrolled content never touches the pager. */}
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
            <View style={[styles.stepper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => goTo(safeIndex - 1)}
                disabled={safeIndex === 0}
                activeOpacity={0.7}
                hitSlop={6}
                style={[styles.chevron, { backgroundColor: colors.primary, opacity: safeIndex === 0 ? 0.35 : 1 }]}
              >
                <IconChevronLeft size={20} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.6} style={styles.stepperCenter}>
                <View style={styles.stepperTopRow}>
                  <Text numberOfLines={1} style={[styles.stepperTitle, { color: colors.foreground }]}>
                    {active?.title ?? "—"}
                  </Text>
                  <Text style={[styles.stepperCount, { color: colors.mutedForeground }]}>
                    {total === 0 ? 0 : safeIndex + 1}/{total}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  {Array.from({ length: Math.max(1, total) }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor:
                          total === 0
                            ? mutedTrack
                            : i === safeIndex
                              ? "#3b82f6"
                              : answers[questions[i]?.id]?.value != null
                                ? colors.primary
                                : mutedTrack,
                      }}
                    />
                  ))}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => goTo(safeIndex + 1)}
                disabled={safeIndex >= total - 1}
                activeOpacity={0.7}
                hitSlop={6}
                style={[styles.chevron, { backgroundColor: colors.primary, opacity: safeIndex >= total - 1 ? 0.35 : 1 }]}
              >
                <IconChevronRight size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
              paddingBottom: showSubmit ? spacing.md : insets.bottom + spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {total === 0 ? (
              <View style={styles.center}>
                <Text style={{ color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: "center" }}>
                  Este questionário ainda não tem perguntas configuradas.
                </Text>
              </View>
            ) : active ? (
              <QuestionCard
                question={active}
                options={active.options ?? []}
                value={activeAnswer?.value ?? null}
                comment={activeAnswer?.comment ?? ""}
                readOnly={isReadOnly}
                onValueChange={(value) => handleValueChange(active.id, value)}
                onCommentChange={(comment) => handleCommentChange(active.id, comment)}
              />
            ) : null}
          </ScrollView>

          {/* Submit — only on the last question, using the shared form action bar
              (consistent button styling, sits in-flow below the scroll, clears the
              home indicator via its own safe-area margin). */}
          {showSubmit && (
            <FormActionBar
              onPrev={() => goTo(0)}
              prevLabel="Revisar"
              isFirstStep={false}
              isLastStep
              showCancel={false}
              onSubmit={handleSubmit}
              submitLabel="Enviar"
              submittingLabel="Enviando"
              isSubmitting={isSubmitting}
              canSubmit={answered === total}
              resetOnSubmitSuccess={false}
            />
          )}

          {/* Jump-to-question bottom sheet */}
          <Sheet open={pickerOpen} onOpenChange={setPickerOpen} snapPoints={[88]}>
            <SheetHeader style={{ borderBottomColor: colors.border }}>
              <View style={styles.sheetHeaderRow}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Selecionar pergunta</Text>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                  <IconX size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </SheetHeader>
            <SheetContent>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: spacing.sm }}>
                {questions.map((q, i) => {
                  const isAns = answers[q.id]?.value != null;
                  const isActive = i === safeIndex;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      activeOpacity={0.6}
                      onPress={() => {
                        goTo(i);
                        setPickerOpen(false);
                      }}
                      style={[
                        styles.modalRow,
                        { borderColor: colors.border },
                        isActive ? { backgroundColor: colors.muted, borderColor: colors.muted } : null,
                      ]}
                    >
                      <View style={[styles.modalRowCircle, { backgroundColor: isAns ? colors.primary : colors.muted }]}>
                        {isAns ? (
                          <IconCheck size={14} color="#ffffff" strokeWidth={3} />
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedForeground }}>{i + 1}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={2}
                          style={{ color: colors.foreground, fontSize: fontSize.sm, fontWeight: isActive ? "700" : "500" }}
                        >
                          {q.title}
                        </Text>
                        {q.group?.name ? (
                          <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 1 }}>
                            {q.group.name}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </SheetContent>
          </Sheet>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  chevron: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: "center", justifyContent: "center" },
  stepperCenter: { flex: 1, gap: 6 },
  stepperTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepperTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: "600" },
  stepperCount: { fontSize: fontSize.sm, fontWeight: "600", fontVariant: ["tabular-nums"] },
  progressTrack: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden" },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: fontSize.md, fontWeight: "700" },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  modalRowCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
