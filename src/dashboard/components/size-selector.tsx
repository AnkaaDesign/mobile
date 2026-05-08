// Mobile size selector — twin pill rows for Largura (span) and Altura (rows).
// Mirrors web's SizeSelector popover but rendered inline because mobile users
// don't have screen real-estate to spare on a hover popover.
//
// Layout decisions:
//   - All possible options render even when disabled (so the user can see what
//     widths/heights exist conceptually) and out-of-allowance options come
//     through with reduced opacity + non-pressable. Mirrors web's "disabled
//     buttons inside the popover" pattern.
//   - Pills use min-height 44 for touch-target compliance.
//   - Active = primary background; inactive = card with border; disabled =
//     card + opacity 0.4 + pointer-events none.
//   - Section is always rendered even if a dimension has only one allowed
//     value — we still show it so the user understands "this widget is locked
//     to this size", which matches web behaviour and removes the hidden-UI
//     surprise reported by the user ("I can't define width/height like web").
//
// Inputs:
//   value:           current size on the instance
//   allowedSpans:    whitelist for span dimension
//   allowedHeights:  whitelist for rows dimension (defaults to all)
//   onChange:        called with full {span, rows} object on each change

import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
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
    <View style={{ gap: 14 }}>
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
          fontSize: 11,
          fontWeight: "700",
          color: colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            active={opt.active}
            disabled={!opt.enabled}
            onPress={() => onSelect(opt.value)}
          />
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
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 44,
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : colors.card,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: active ? colors.primaryForeground : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Summary({ span, rows }: { span: string; rows: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        color: colors.mutedForeground,
        textAlign: "center",
      }}
    >
      {span} de largura • {rows} de altura
    </Text>
  );
}
