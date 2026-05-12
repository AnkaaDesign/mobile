// Mobile size selector — pill-segmented control for picking widget size.
//
// Two stacked pill rows + a compact live preview, designed to live inside the
// configure-widget modal's `ConfigCard` chrome. The card provides the title
// strip ("Tamanho") and the outer border, so this component contributes only
// the body content. Visual hierarchy mirrors the web reference's popover but
// scaled up for touch:
//
//   • Largura: 1/3 / 2/3 / Total      (allowedSpans gates which are enabled)
//   • Altura : 1× / 2× / 3× / 4×      (allowedHeights gates which are enabled)
//   • Pré-visualização rectangle showing the chosen span × rows proportions.
//
// Visual contract (matches user spec for v2 polish):
//   - Section labels: 12px / 500 weight, mutedForeground, NOT uppercase. The
//     previous all-caps shouty labels fought the ConfigCard's title strip.
//   - Pills: flex:1, gap 8, height 40 (touch-target spec), borderRadius 8,
//     borderWidth 1.5 (1px is invisible against the dark sheet bg).
//   - ACTIVE: primary fill, primaryForeground text (white), small ✓ icon
//     absolute top-right; soft primary shadow.
//   - INACTIVE ENABLED: 1.5px outline + subtle fill tint
//     `rgba(255,255,255,0.04)` (dark) / `rgba(0,0,0,0.04)` (light) so the
//     pill shape is visible against a dark sheet surface.
//   - DISABLED: opacity 0.4, no press feedback.
//   - Preview: a single proportionally-sized rectangle inside a 3-slot track,
//     spanning continuously across `span` slots (NOT split into separate
//     rounded chunks). Height scales with rows token.
//   - Footer summary: 12px mutedForeground tabular-nums, separated from the
//     preview by 4px gap (no border — the ConfigCard supplies the boundary).
//
// Haptics: lightImpactHaptic() fires BEFORE state mutation on every press.

import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { IconCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { lightImpactHaptic } from "@/utils/haptics";
import {
  WIDGET_SPAN_VALUES,
  WIDGET_SPAN_LABELS,
  WIDGET_ROW_VALUES,
  WIDGET_ROW_LABELS,
  type WidgetSize,
  type WidgetSpan,
  type WidgetRows,
} from "../types";

interface SizeSelectorProps {
  value: WidgetSize;
  allowedSpans: readonly WidgetSpan[];
  allowedHeights?: readonly WidgetRows[];
  onChange: (size: WidgetSize) => void;
}

export function SizeSelector({
  value,
  allowedSpans,
  allowedHeights,
  onChange,
}: SizeSelectorProps) {
  const heights = allowedHeights ?? WIDGET_ROW_VALUES;
  const summarySpan = WIDGET_SPAN_LABELS[value.span];
  const summaryRows = WIDGET_ROW_LABELS[value.rows];

  return (
    <View style={{ gap: 12 }}>
      <Row
        label="Largura"
        options={WIDGET_SPAN_VALUES.map((span) => ({
          value: span,
          label: WIDGET_SPAN_LABELS[span],
          enabled: allowedSpans.includes(span),
          active: span === value.span,
        }))}
        onSelect={(span) =>
          onChange({ span: span as WidgetSpan, rows: value.rows })
        }
      />
      <Row
        label="Altura"
        options={WIDGET_ROW_VALUES.map((rows) => ({
          value: rows,
          label: WIDGET_ROW_LABELS[rows],
          enabled: heights.includes(rows),
          active: rows === value.rows,
        }))}
        onSelect={(rows) =>
          onChange({ span: value.span, rows: rows as WidgetRows })
        }
      />
      <Summary span={summarySpan} rows={summaryRows} />
    </View>
  );
}

interface RowProps {
  label: string;
  options: { value: number; label: string; enabled: boolean; active: boolean }[];
  onSelect: (value: number) => void;
}

function Row({ label, options, onSelect }: RowProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          // 12/500 mutedForeground — calmer than the previous 11/700 uppercase
          // scream label. Sits cleanly under the ConfigCard title strip.
          fontSize: 12,
          fontWeight: "500",
          color: colors.mutedForeground,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((opt) => (
          <View key={opt.value} style={{ flex: 1 }}>
            <Pill
              label={opt.label}
              active={opt.active}
              disabled={!opt.enabled}
              onPress={() => {
                if (!opt.active) void lightImpactHaptic();
                onSelect(opt.value);
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

interface PillProps {
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}

function Pill({ label, active, disabled, onPress }: PillProps) {
  const { colors, isDark } = useTheme();
  // Outline tint — colors.border at 1px is invisible against the dark sheet
  // surface, so we composite a stronger outline at 1.5px so inactive enabled
  // pills always show a visible edge.
  const outlineColor = isDark ? "rgba(217,217,217,0.32)" : "rgba(64,64,64,0.24)";
  // Subtle fill tint so the pill shape reads when the border is dim.
  const inactiveBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  // Smooth selected-state transition — a soft spring on scale gives the
  // selected pill a satisfying tactile feel without overdoing it.
  const scale = useSharedValue(active ? 1 : 0.98);
  useEffect(() => {
    scale.value = withSpring(active ? 1 : 0.98, {
      damping: 18,
      stiffness: 220,
    });
  }, [active, scale]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      hitSlop={disabled ? undefined : 4}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            {
              position: "relative",
              // 40px touch target (web pills are 36 inside a popover; mobile
              // bumps to 40 for confident finger taps inside a sheet).
              height: 40,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: active ? colors.primary : outlineColor,
              backgroundColor: active
                ? colors.primary
                : disabled
                  ? "transparent"
                  : pressed
                    ? colors.muted
                    : inactiveBg,
              alignItems: "center",
              justifyContent: "center",
              // Disabled is more readable at 0.4 than 0.3 — user can still
              // see the label and understand WHY it's gated.
              opacity: disabled ? 0.4 : 1,
              shadowColor: active ? colors.primary : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: active ? 0.25 : 0,
              shadowRadius: 3,
              elevation: active ? 2 : 0,
            },
            animStyle,
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontWeight: active ? "600" : "500",
              color: active ? colors.primaryForeground : colors.foreground,
              paddingHorizontal: 4,
            }}
          >
            {label}
          </Text>
          {active && (
            <View
              style={{
                position: "absolute",
                top: 3,
                right: 4,
              }}
            >
              <IconCheck size={11} color={colors.primaryForeground} />
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

function Summary({ span, rows }: { span: string; rows: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        color: colors.mutedForeground,
        textAlign: "center",
        fontVariant: ["tabular-nums"],
      }}
    >
      {span} de largura · {rows} de altura
    </Text>
  );
}
