// Mobile size selector — matches web's `web/src/dashboard/components/
// size-selector.tsx` button-grid pattern exactly. Spec source: agent audit
// of the web file.
//
// Anatomy (per web spec):
//   - Section gap: 12 (web `space-y-3`)
//   - Per-section: 6px gap between label and grid (`space-y-1.5`)
//   - Label: fontSize 11, fontWeight "600", uppercase, letterSpacing 0.6,
//            color mutedForeground
//   - Grid: a flex row with 4px gap between buttons. Each button wrapped in
//           a `<View flex:1>` so each Pressable gets its share of the row
//           (without the wrapper, RN's flex resolution can collapse the
//           Pressables on iOS — same bug class as the table-row issue).
//   - Button (web `h-9 rounded-md text-xs font-medium border`):
//             height 36 (FIXED, not minHeight), borderRadius 6, borderWidth 1,
//             fontSize 12, fontWeight "500"
//   - Active: bg primary, text primaryForeground, border primary, plus the
//             absolute IconCheck overlay top-right (12px, 2px from edges)
//   - Inactive: TRANSPARENT bg + border colors.border (web `bg-card border`).
//             Mobile previously filled with `colors.card` which blended with
//             the bottom-sheet surface — pills became visible only as text.
//   - Disabled: opacity 0.3, no fill, border at 40% alpha
//   - Footer: borderTop 1, paddingTop 6, fontSize 11, color mutedForeground,
//             textAlign center, with tabular-nums.
//
// Why we don't use IconCheck from lucide: tabler-icons-react-native is the
// project standard (everywhere else uses Icon* from @tabler/icons-react-native).

import { View, Text, Pressable } from "react-native";
import { IconCheck } from "@tabler/icons-react-native";
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
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {options.map((opt) => (
          <View key={opt.value} style={{ flex: 1 }}>
            <Pill
              label={opt.label}
              active={opt.active}
              disabled={!opt.enabled}
              onPress={() => onSelect(opt.value)}
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
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        position: "relative",
        height: 36,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: active
          ? colors.primary
          : disabled
            ? colors.border + "66"
            : colors.border,
        backgroundColor: active
          ? colors.primary
          : pressed && !disabled
            ? colors.muted
            : "transparent",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.3 : 1,
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: active ? colors.primaryForeground : colors.foreground,
        }}
      >
        {label}
      </Text>
      {active && (
        <View
          style={{
            position: "absolute",
            top: 2,
            right: 2,
          }}
        >
          <IconCheck size={12} color={colors.primaryForeground} />
        </View>
      )}
    </Pressable>
  );
}

function Summary({ span, rows }: { span: string; rows: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        fontSize: 11,
        color: colors.mutedForeground,
        textAlign: "center",
        fontVariant: ["tabular-nums"],
      }}
    >
      {span} largura • {rows} de altura
    </Text>
  );
}
