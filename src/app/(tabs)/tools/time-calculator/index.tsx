import { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView, ThemedText } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useScreenReady } from "@/hooks/use-screen-ready";

import {
  evaluateTimeExpression,
  formatCalcMinutes,
  type EvalResult,
} from "@/utils/time-math";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
}

type KeyKind =
  | "digit"
  | "colon"
  | "op"
  | "equals"
  | "back"
  | "clear"
  | "memory";

interface KeySpec {
  label: string;
  value: string;
  kind: KeyKind;
  /** For "=" — render as a tall right-edge column. */
  fullColumn?: boolean;
  accessibilityLabel?: string;
}

const HISTORY_LIMIT = 50;

// 4-column keypad (the 5th column "=" is rendered separately as a tall column)
// Rows are numbered top→bottom; the `=` column spans rows 1..3 (the bottom 4
// rows). Row 0 is the memory/clear row, also 4 columns; `=` only spans the
// arithmetic rows.
const MEMORY_ROW: KeySpec[] = [
  { label: "MC", value: "MC", kind: "memory", accessibilityLabel: "Limpar memória" },
  { label: "MR", value: "MR", kind: "memory", accessibilityLabel: "Recuperar memória" },
  { label: "MS", value: "MS", kind: "memory", accessibilityLabel: "Salvar na memória" },
  { label: "M+", value: "M+", kind: "memory", accessibilityLabel: "Somar à memória" },
];

const ARITHMETIC_ROWS: KeySpec[][] = [
  [
    { label: "7", value: "7", kind: "digit" },
    { label: "8", value: "8", kind: "digit" },
    { label: "9", value: "9", kind: "digit" },
    { label: "+", value: "+", kind: "op" },
  ],
  [
    { label: "4", value: "4", kind: "digit" },
    { label: "5", value: "5", kind: "digit" },
    { label: "6", value: "6", kind: "digit" },
    { label: "-", value: "-", kind: "op" },
  ],
  [
    { label: "1", value: "1", kind: "digit" },
    { label: "2", value: "2", kind: "digit" },
    { label: "3", value: "3", kind: "digit" },
    { label: "*", value: "*", kind: "op" },
  ],
  [
    { label: "0", value: "0", kind: "digit" },
    { label: ":", value: ":", kind: "colon" },
    { label: "/", value: "/", kind: "op" },
    // The 4th column on the last arithmetic row is filled by "C" then "←" on
    // the right side via the top-bar (we put C / ← on the memory row's right
    // and rebalance — see render below).
    { label: "", value: "", kind: "digit" }, // placeholder, replaced at render
  ],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OP_CHARS: ReadonlyArray<string> = ["+", "-", "*", "/"];

function endsWithOperator(s: string): boolean {
  if (s.length === 0) return false;
  return OP_CHARS.includes(s[s.length - 1]);
}

function lastTokenAllowsColon(s: string): boolean {
  // Find the last operator in the string; the colon is only valid if the
  // current token (after the last op) is non-empty all-digits with no colon.
  let i = s.length - 1;
  while (i >= 0 && !OP_CHARS.includes(s[i])) i--;
  const tok = s.slice(i + 1);
  if (tok.length === 0) return false;
  if (tok.includes(":")) return false;
  return /^\d+$/.test(tok);
}

function appendChar(display: string, ch: string): string {
  return display + ch;
}

function backspace(display: string): string {
  if (display.length === 0) return display;
  return display.slice(0, -1);
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TimeCalculatorScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  useScreenReady();

  const [display, setDisplay] = useState<string>("");
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live preview of the current expression (best-effort).
  const preview = useMemo<EvalResult | null>(() => {
    if (display.length === 0) return null;
    if (endsWithOperator(display)) return null;
    return evaluateTimeExpression(display);
  }, [display]);

  const evaluatedNow = useCallback((): EvalResult => {
    if (display.length === 0) return { ok: false, error: "Erro" };
    return evaluateTimeExpression(display);
  }, [display]);

  // -----------------------------------------------------------------------
  // Key handlers
  // -----------------------------------------------------------------------

  const handleAppend = useCallback((value: string) => {
    setError(null);
    setDisplay((d) => appendChar(d, value));
  }, []);

  const handleOperator = useCallback((op: string) => {
    setError(null);
    setDisplay((d) => {
      if (d.length === 0) return d; // ignore leading operators
      if (endsWithOperator(d)) {
        // Replace the trailing operator
        return d.slice(0, -1) + op;
      }
      return d + op;
    });
  }, []);

  const handleColon = useCallback(() => {
    setError(null);
    setDisplay((d) => {
      if (!lastTokenAllowsColon(d)) return d;
      return d + ":";
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setError(null);
    setDisplay((d) => backspace(d));
  }, []);

  const handleClear = useCallback(() => {
    setError(null);
    setDisplay("");
  }, []);

  const handleEquals = useCallback(() => {
    if (display.length === 0) return;
    const res = evaluateTimeExpression(display);
    if (!res.ok) {
      setError("Erro");
      return;
    }
    const formatted = formatCalcMinutes(res.minutes);
    const expression = display;
    setHistory((prev) => {
      const next: HistoryEntry[] = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          expression,
          result: formatted,
        },
        ...prev,
      ];
      return next.slice(0, HISTORY_LIMIT);
    });
    setDisplay(formatted.startsWith("-") ? formatted : formatted);
    setError(null);
  }, [display]);

  const handleMemory = useCallback((key: string) => {
    setError(null);
    if (key === "MC") {
      setMemory(0);
      return;
    }
    if (key === "MR") {
      setDisplay((d) => d + formatCalcMinutes(memory));
      return;
    }
    const res = evaluatedNow();
    if (!res.ok) {
      // Memory ops require a valid current value
      setError("Erro");
      return;
    }
    if (key === "MS") {
      setMemory(res.minutes);
    } else if (key === "M+") {
      setMemory((m) => m + res.minutes);
    }
  }, [evaluatedNow, memory]);

  const handleHistoryTap = useCallback((entry: HistoryEntry) => {
    setError(null);
    setDisplay(entry.result);
  }, []);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderKey = (
    spec: KeySpec,
    extraStyle?: ViewStyle,
  ) => {
    const onPress = () => {
      switch (spec.kind) {
        case "digit":
          handleAppend(spec.value);
          break;
        case "colon":
          handleColon();
          break;
        case "op":
          handleOperator(spec.value);
          break;
        case "equals":
          handleEquals();
          break;
        case "back":
          handleBackspace();
          break;
        case "clear":
          handleClear();
          break;
        case "memory":
          handleMemory(spec.value);
          break;
      }
    };

    const isOp = spec.kind === "op" || spec.kind === "colon";
    const isAccent = spec.kind === "equals";
    const isUtility =
      spec.kind === "back" ||
      spec.kind === "clear" ||
      spec.kind === "memory";

    const bg = isAccent
      ? colors.primary
      : isOp
        ? (isDark ? colors.muted : colors.muted)
        : isUtility
          ? colors.card
          : colors.card;
    const fg = isAccent
      ? colors.primaryForeground
      : isOp
        ? colors.foreground
        : colors.foreground;

    const labelStyle: TextStyle = {
      fontSize: spec.kind === "memory" ? 14 : 22,
      fontWeight: "600",
      color: fg,
    };

    return (
      <Pressable
        key={`${spec.label}-${spec.value}-${spec.kind}`}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={spec.accessibilityLabel ?? spec.label}
        style={({ pressed }) => [
          styles.key,
          {
            backgroundColor: bg,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
          extraStyle,
        ]}
      >
        <ThemedText style={labelStyle}>{spec.label}</ThemedText>
      </Pressable>
    );
  };

  const displayText =
    error !== null
      ? "Erro"
      : display.length === 0
        ? "0:00"
        : display;

  const previewText = useMemo(() => {
    if (error !== null) return null;
    if (preview === null) return null;
    if (!preview.ok) return null;
    return formatCalcMinutes(preview.minutes);
  }, [preview, error]);

  // -----------------------------------------------------------------------
  // Layout
  // -----------------------------------------------------------------------

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Calculadora de Horas",
          headerShown: true,
        }}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Display */}
        <Card style={styles.displayCard}>
          <CardContent style={styles.displayContent}>
            <View style={styles.displayTopRow}>
              {memory !== 0 ? (
                <View
                  style={[
                    styles.memoryBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <ThemedText style={styles.memoryBadgeText}>M</ThemedText>
                </View>
              ) : (
                <View style={styles.memoryBadgePlaceholder} />
              )}
              <ThemedText
                style={[styles.expression, { color: colors.mutedForeground }]}
                numberOfLines={1}
                ellipsizeMode="head"
              >
                {display.length > 0 ? display : " "}
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.displayValue,
                error !== null && { color: colors.destructive },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {error !== null ? "Erro" : previewText ?? displayText}
            </ThemedText>
          </CardContent>
        </Card>

        {/* Keypad: top row = memory keys (4) + C in 5th col */}
        <View style={styles.keypad}>
          <View style={styles.keypadGrid}>
            {/* Row 0: MC MR MS M+ | C */}
            <View style={styles.keyRow}>
              {MEMORY_ROW.map((k) => renderKey(k))}
              {renderKey({
                label: "C",
                value: "C",
                kind: "clear",
                accessibilityLabel: "Limpar",
              })}
            </View>

            {/* Row 1: 7 8 9 + | ← */}
            <View style={styles.keyRow}>
              {ARITHMETIC_ROWS[0].map((k) => renderKey(k))}
              {renderKey({
                label: "←",
                value: "←",
                kind: "back",
                accessibilityLabel: "Apagar",
              })}
            </View>

            {/* Row 2: 4 5 6 - | (empty top of "=" tall column) */}
            {/* We render rows 2..4 as a horizontal split: left 4 cols + right "=" */}
            <View style={styles.bottomBlock}>
              <View style={styles.bottomLeft}>
                <View style={styles.keyRow}>
                  {ARITHMETIC_ROWS[1].map((k) => renderKey(k))}
                </View>
                <View style={styles.keyRow}>
                  {ARITHMETIC_ROWS[2].map((k) => renderKey(k))}
                </View>
                <View style={styles.keyRow}>
                  {ARITHMETIC_ROWS[3].slice(0, 3).map((k) => renderKey(k))}
                  {/* 4th cell of last row stays empty for symmetry; replace
                       the placeholder with an empty spacer */}
                  <View style={[styles.key, styles.keySpacer]} />
                </View>
              </View>
              <View style={styles.bottomRight}>
                {renderKey(
                  {
                    label: "=",
                    value: "=",
                    kind: "equals",
                    accessibilityLabel: "Igual",
                  },
                  styles.equalsKey,
                )}
              </View>
            </View>
          </View>
        </View>

        {/* History */}
        <Card style={styles.historyCard}>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <ThemedText
                style={[styles.historyEmpty, { color: colors.mutedForeground }]}
              >
                Sem cálculos ainda. Use a calculadora para somar, subtrair,
                multiplicar ou dividir tempos.
              </ThemedText>
            ) : (
              <View style={styles.historyList}>
                {history.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => handleHistoryTap(entry)}
                    style={({ pressed }) => [
                      styles.historyItem,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Reusar resultado ${entry.result}`}
                  >
                    <ThemedText
                      style={[
                        styles.historyExpr,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.expression}
                    </ThemedText>
                    <ThemedText style={styles.historyResult}>
                      = {entry.result}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const KEY_GAP = 8;
const KEY_HEIGHT = 56;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Display
  displayCard: {
    marginBottom: 4,
  },
  displayContent: {
    paddingVertical: 16,
    gap: 8,
  },
  displayTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 22,
  },
  memoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  memoryBadgePlaceholder: {
    width: 0,
    height: 22,
  },
  expression: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  displayValue: {
    fontSize: 56,
    fontWeight: "700",
    lineHeight: 60,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },

  // Keypad
  keypad: {
    marginBottom: 4,
  },
  keypadGrid: {
    gap: KEY_GAP,
  },
  keyRow: {
    flexDirection: "row",
    gap: KEY_GAP,
  },
  bottomBlock: {
    flexDirection: "row",
    gap: KEY_GAP,
  },
  bottomLeft: {
    flex: 4,
    gap: KEY_GAP,
  },
  bottomRight: {
    flex: 1,
  },
  key: {
    flex: 1,
    minHeight: KEY_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keySpacer: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  equalsKey: {
    flex: 1,
    height: "100%",
    minHeight: KEY_HEIGHT * 3 + KEY_GAP * 2,
  },

  // History
  historyCard: {
    marginTop: 4,
  },
  historyEmpty: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    gap: 2,
  },
  historyExpr: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  historyResult: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
