// components/questionnaire/question-card.tsx
//
// One question card for the mobile self-fill flow. Mirrors the web QuestionScorer
// adapted for mobile: single-column, full-width option cards (the web grid
// collapses to one column anyway), generous tap targets, optional comment.
// Uses the same 0..5 colour ramp as the web ScoreBadge.

import { View, Text, Pressable, TextInput } from "react-native";
import { IconCheck } from "@tabler/icons-react-native";
import type { QuestionnaireQuestion, QuestionnaireOption } from "@/types";

// Mirror of web getScoreBadgeClasses (0..5).
const SCORE_BG: Record<number, string> = {
  0: "bg-neutral-900",
  1: "bg-red-700",
  2: "bg-orange-600",
  3: "bg-teal-700",
  4: "bg-blue-700",
  5: "bg-green-700",
};

function scoreBg(value: number) {
  return SCORE_BG[value] ?? "bg-neutral-400";
}

interface QuestionCardProps {
  index: number;
  question: QuestionnaireQuestion;
  options: QuestionnaireOption[];
  value: number | null;
  comment: string;
  readOnly?: boolean;
  onValueChange: (value: number) => void;
  onCommentChange: (value: string) => void;
}

export function QuestionCard({
  index,
  question,
  options,
  value,
  comment,
  readOnly,
  onValueChange,
  onCommentChange,
}: QuestionCardProps) {
  const sorted = [...options].sort((a, b) => a.order - b.order);
  const selected = value == null ? null : sorted.find((o) => o.value === value) ?? null;

  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2">
          <Text className="text-xs font-semibold text-foreground">{index + 1}</Text>
        </View>
        {question.group?.name ? (
          <View className="rounded-full border border-border px-2 py-0.5">
            <Text className="text-[10px] text-muted-foreground">{question.group.name}</Text>
          </View>
        ) : null}
      </View>

      <Text className="text-base font-semibold leading-snug text-foreground">{question.title}</Text>
      {question.description ? (
        <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">{question.description}</Text>
      ) : null}
      {question.helpText ? (
        <View className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Text className="text-xs text-blue-900 dark:text-blue-200">{question.helpText}</Text>
        </View>
      ) : null}

      {readOnly ? (
        <View className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
          {selected ? (
            <View className="flex-row items-center gap-2">
              <View className={`h-7 w-7 items-center justify-center rounded-full ${scoreBg(selected.value)}`}>
                <Text className="text-xs font-semibold text-white">{selected.value}</Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">{selected.label}</Text>
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">Sem resposta registrada</Text>
          )}
        </View>
      ) : (
        <View className="mt-3 gap-2">
          {sorted.map((option) => {
            const isSel = value === option.value;
            return (
              <Pressable
                key={option.id}
                onPress={() => onValueChange(option.value)}
                className={`flex-row items-center gap-3 rounded-xl border-2 p-3 ${
                  isSel ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <View className={`h-8 w-8 items-center justify-center rounded-full ${scoreBg(option.value)}`}>
                  <Text className="text-sm font-semibold text-white">{option.value}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{option.label}</Text>
                  {option.description ? (
                    <Text className="text-xs text-muted-foreground">{option.description}</Text>
                  ) : null}
                </View>
                {isSel ? <IconCheck size={18} color="#15803d" /> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="mt-3 rounded-lg border border-border bg-card p-3">
        <Text className="mb-1 text-sm font-medium text-foreground">
          Comentário <Text className="text-xs font-normal text-muted-foreground">(opcional)</Text>
        </Text>
        {readOnly ? (
          comment ? (
            <Text className="text-sm text-muted-foreground">{comment}</Text>
          ) : (
            <Text className="text-xs italic text-muted-foreground">Nenhum comentário.</Text>
          )
        ) : (
          <TextInput
            value={comment}
            onChangeText={onCommentChange}
            placeholder="Adicione um comentário (opcional)…"
            multiline
            className="min-h-16 rounded-md border border-border bg-background p-2 text-sm text-foreground"
            textAlignVertical="top"
          />
        )}
      </View>
    </View>
  );
}
