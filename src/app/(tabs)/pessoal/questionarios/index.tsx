// app/(tabs)/pessoal/questionarios/index.tsx
//
// "Meus Questionários" — the logged-in user's self-fill queue (mobile).
// Available to ALL users.
//
// Direct-open: when there is exactly ONE pending (not-yet-submitted) entry we
// skip the list entirely and land the user straight on the fill screen. With
// several pending entries we keep a minimal list; with none we show a simple
// empty state.

import { useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { IconChevronRight, IconClipboardList } from "@tabler/icons-react-native";

import { useMyQuestionnaireEntries } from "@/hooks/useQuestionnaire";
import { useTheme } from "@/lib/theme";
import type { QuestionnaireEntry, QuestionnaireEntryStatus } from "@/types";

const STATUS_LABEL: Record<QuestionnaireEntryStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  SUBMITTED: "Enviado",
};
const STATUS_CLASS: Record<QuestionnaireEntryStatus, string> = {
  PENDING: "bg-muted",
  IN_PROGRESS: "bg-blue-700",
  SUBMITTED: "bg-green-700",
};

/** Pending = the user still has to act on it (anything not yet submitted). */
const isPending = (e: QuestionnaireEntry) => e.status !== "SUBMITTED";

const fmt = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export default function MyQuestionnairesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = useMyQuestionnaireEntries();
  const entries = useMemo(() => (data?.data ?? []) as QuestionnaireEntry[], [data]);
  const pending = useMemo(() => entries.filter(isPending), [entries]);

  // Direct-open: a single pending entry redirects straight to the fill screen.
  // No pending entries: this screen has nothing to show, so bounce home instead
  // of rendering an empty state (the drawer entry is hidden in this case too).
  // Runs on focus so returning from a submit (which removes it from `pending`)
  // does not bounce the user back into the now-submitted questionnaire.
  useFocusEffect(
    useCallback(() => {
      if (isLoading) return;
      if (pending.length === 1) {
        router.replace(`/pessoal/questionarios/preencher/${pending[0].id}` as any);
      } else if (pending.length === 0) {
        router.replace("/" as any);
      }
    }, [isLoading, pending, router]),
  );

  const goToEntry = (id: string) => router.push(`/pessoal/questionarios/preencher/${id}` as any);

  // While loading or about to redirect (0 pending → home, 1 pending → fill),
  // render only a themed spinner — never the "Meus Questionários" heading or
  // empty state, which would flash for a moment before the redirect.
  if (isLoading || pending.length <= 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
        <IconClipboardList size={22} color={colors.primary} />
        <Text className="text-xl font-bold text-foreground">Meus Questionários</Text>
      </View>

      {/* Only ≥2 pending entries reach here — 0 redirects home, 1 direct-opens. */}
      <ScrollView contentContainerClassName="gap-3 p-4">
        {pending.map((entry) => {
            const status = entry.status as QuestionnaireEntryStatus;
            return (
              <Pressable
                key={entry.id}
                onPress={() => goToEntry(entry.id)}
                className="flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <View className="flex-1">
                  <Text className="font-medium text-foreground" numberOfLines={1}>
                    {entry.questionnaire?.name ?? "Questionário"}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {fmt(entry.questionnaire?.periodStart)} – {fmt(entry.questionnaire?.periodEnd)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className={`rounded-full px-2 py-0.5 ${STATUS_CLASS[status]}`}>
                    <Text className={`text-[11px] ${status === "PENDING" ? "text-foreground" : "text-white"}`}>
                      {STATUS_LABEL[status]}
                    </Text>
                  </View>
                  <IconChevronRight size={16} color="#9ca3af" />
                </View>
              </Pressable>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
