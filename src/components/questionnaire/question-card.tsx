// components/questionnaire/question-card.tsx
//
// One ACTIVE question for the mobile self-fill flow, mirroring the web fill page:
// full title + group chip, a "Descrição" card, an optional blue "Informação
// auxiliar" card, a fully-coloured score picker (each level card painted with the
// 0..5 palette like the web ScoreLevelPicker — not just the number circle), and
// an optional comment. Uses the useTheme() token system so dark mode renders
// correctly (NativeWind semantic classes did not switch on this screen).

import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { IconCheck, IconInfoCircle, IconNotes } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import type { QuestionnaireQuestion, QuestionnaireOption } from "@/types";

// Full-card colours mirror the web ScoreLevelPicker LEVEL_BG (0..5):
// purple → red → orange → teal → blue → green. Text is always white.
const SCORE_COLORS: Record<number, string> = {
  0: "#7e22ce", // purple-700
  1: "#b91c1c", // red-700
  2: "#ea580c", // orange-600
  3: "#0f766e", // teal-700
  4: "#1d4ed8", // blue-700
  5: "#15803d", // green-700
};
const scoreColor = (v: number) => SCORE_COLORS[v] ?? "#525252";

interface QuestionCardProps {
  question: QuestionnaireQuestion;
  options: QuestionnaireOption[];
  value: number | null;
  comment: string;
  readOnly?: boolean;
  onValueChange: (value: number) => void;
  onCommentChange: (value: string) => void;
}

export function QuestionCard({
  question,
  options,
  value,
  comment,
  readOnly,
  onValueChange,
  onCommentChange,
}: QuestionCardProps) {
  const { colors, isDark } = useTheme();
  const sorted = [...options].sort((a, b) => a.order - b.order);
  const selected = value == null ? null : sorted.find((o) => o.value === value) ?? null;

  // Blue "info" tones for the auxiliary card, readable in both themes.
  const aux = {
    bg: isDark ? "rgba(30,58,138,0.20)" : "#eff6ff",
    border: isDark ? "rgba(59,130,246,0.40)" : "#bfdbfe",
    label: isDark ? "#93c5fd" : "#1d4ed8",
    text: isDark ? "#dbeafe" : "#1e3a8a",
  };

  const renderScoreCard = (option: QuestionnaireOption, isSel: boolean, dimmed: boolean) => (
    // Outer wrapper = the selection RING; its padding is the offset gap (page bg
    // shows through) between the ring and the coloured card — mirrors the web's
    // ring-offset. Transparent when unselected so layout never shifts.
    <View
      style={[
        styles.scoreRing,
        isSel ? { borderColor: colors.foreground } : null,
        dimmed ? styles.scoreCardDimmed : null,
      ]}
    >
      <View style={[styles.scoreCard, { backgroundColor: scoreColor(option.value) }]}>
        <View style={styles.scoreHeaderRow}>
          <View style={styles.scoreCircle}>
            {isSel ? (
              <IconCheck size={13} color="#ffffff" strokeWidth={3} />
            ) : (
              <Text style={styles.scoreNum}>{option.value}</Text>
            )}
          </View>
          <Text style={styles.scoreLabel}>{option.label}</Text>
        </View>
        {option.description ? <Text style={styles.scoreDesc}>{option.description}</Text> : null}
      </View>
    </View>
  );

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Title + group live in the pager (stepper). Content starts with Descrição. */}

      {/* Descrição */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.auxLabelRow}>
          <IconNotes size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>DESCRIÇÃO</Text>
        </View>
        <Text style={[styles.infoText, { color: colors.foreground }]}>
          {question.description || "Sem descrição."}
        </Text>
      </View>

      {/* Informação auxiliar */}
      {question.helpText ? (
        <View style={[styles.infoCard, { backgroundColor: aux.bg, borderColor: aux.border }]}>
          <View style={styles.auxLabelRow}>
            <IconInfoCircle size={14} color={aux.label} />
            <Text style={[styles.infoLabel, { color: aux.label }]}>INFORMAÇÃO AUXILIAR</Text>
          </View>
          <Text style={[styles.infoText, { color: aux.text }]}>{question.helpText}</Text>
        </View>
      ) : null}

      {/* Score picker — fully-coloured cards */}
      {readOnly ? (
        selected ? (
          renderScoreCard(selected, true, false)
        ) : (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: fontSize.sm }}>Sem resposta registrada</Text>
          </View>
        )
      ) : (
        <View style={{ gap: spacing.sm }}>
          {sorted.map((option) => (
            <Pressable key={option.id} onPress={() => onValueChange(option.value)}>
              {renderScoreCard(option, value === option.value, false)}
            </Pressable>
          ))}
        </View>
      )}

      {/* Comentário */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>COMENTÁRIO (OPCIONAL)</Text>
        {readOnly ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: fontSize.sm,
              fontStyle: comment ? "normal" : "italic",
            }}
          >
            {comment || "Nenhum comentário."}
          </Text>
        ) : (
          <TextInput
            value={comment}
            onChangeText={onCommentChange}
            placeholder="Adicione um comentário (opcional)…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.commentInput,
              { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground },
            ]}
            textAlignVertical="top"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  title: { fontSize: fontSize.lg, fontWeight: "700", lineHeight: fontSize.lg * 1.3 },
  infoCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.sm, gap: 4 },
  infoLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  infoText: { fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5 },
  auxLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreRing: {
    borderRadius: borderRadius.lg + 4,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 3,
  },
  scoreCard: {
    gap: 6,
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  scoreCardDimmed: { opacity: 0.5 },
  scoreHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  scoreCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  scoreLabel: { color: "#ffffff", fontWeight: "700", fontSize: fontSize.sm },
  scoreDesc: { color: "rgba(255,255,255,0.92)", fontSize: fontSize.xs, lineHeight: fontSize.xs * 1.45 },
  commentInput: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.sm,
  },
});
