// Shared widget primitives for the mobile dashboard. Mirror of
// web/src/dashboard/widgets/_shared.tsx but adapted for React Native:
//   - no HTML/Tailwind grid; use NativeWind classNames the same way
//   - Section uses @rn-primitives/collapsible
//   - ToggleRow uses our Switch (web uses a Sim/Não Combobox, but on mobile
//     a touch switch is more idiomatic and saves vertical space)
//
// Density utility values are interchangeable with web's so the same persisted
// config still validates against the same Zod schema. The padding/text values
// are written as NativeWind class strings.

import { type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { IconChevronDown } from "@tabler/icons-react-native";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Section — collapsible bordered card matching the web Section. We use a local
// state + animated rotate on the chevron rather than the @rn-primitives one
// because we need the icon-rotate behaviour and the primitive does not expose
// an `open` state hook.
// ---------------------------------------------------------------------------

export function Section({
  title,
  defaultOpen = false,
  icon,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const rotate = useSharedValue(defaultOpen ? 180 : 0);

  const chevStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    rotate.value = withTiming(next ? 180 : 0, {
      duration: 160,
      easing: Easing.inOut(Easing.ease),
    });
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={toggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          {icon}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            {title}
          </Text>
        </View>
        <Animated.View style={chevStyle}>
          <IconChevronDown size={16} color={colors.mutedForeground} />
        </Animated.View>
      </Pressable>
      {open && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 12,
            paddingTop: 4,
            gap: 12,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ToggleRow — boolean field. Web renders a Sim/Não Combobox to keep the form
// vocabulary uniform; mobile uses a native Switch which is more touch-friendly
// and conserves vertical space.
// ---------------------------------------------------------------------------

export function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.foreground,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </View>
      {hint && (
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{hint}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Density helpers — values match the web (`compact`/`comfortable`/`spacious`)
// so the same config payload is interpreted consistently across platforms.
// Padding numbers are pixel values appropriate for touch targets on mobile —
// a touch row should not be tighter than ~36px, so even compact has some air.
// ---------------------------------------------------------------------------

export const DENSITY_VALUES = ["compact", "comfortable", "spacious"] as const;
export type Density = (typeof DENSITY_VALUES)[number];

export const DENSITY_OPTIONS = [
  { value: "compact", label: "Compacta" },
  { value: "comfortable", label: "Confortável" },
  { value: "spacious", label: "Espaçosa" },
];

export function densityClasses(d: Density): {
  rowPaddingY: number;
  rowPaddingX: number;
  fontSize: number;
  headerFontSize: number;
} {
  if (d === "compact") {
    return { rowPaddingY: 6, rowPaddingX: 10, fontSize: 12, headerFontSize: 10 };
  }
  if (d === "spacious") {
    return { rowPaddingY: 12, rowPaddingX: 14, fontSize: 14, headerFontSize: 11 };
  }
  return { rowPaddingY: 8, rowPaddingX: 12, fontSize: 13, headerFontSize: 11 };
}

export function cardDensityClasses(d: Density): {
  cardPaddingY: number;
  cardPaddingX: number;
  primaryFontSize: number;
  metaFontSize: number;
} {
  if (d === "compact") {
    return { cardPaddingY: 8, cardPaddingX: 10, primaryFontSize: 12, metaFontSize: 11 };
  }
  if (d === "spacious") {
    return { cardPaddingY: 12, cardPaddingX: 14, primaryFontSize: 14, metaFontSize: 12 };
  }
  return { cardPaddingY: 10, cardPaddingX: 12, primaryFontSize: 13, metaFontSize: 11 };
}

// ---------------------------------------------------------------------------
// Sort & refresh option lists — same string values as web for parity.
// ---------------------------------------------------------------------------

export const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Crescente" },
  { value: "desc", label: "Decrescente" },
];

export const REFETCH_INTERVAL_OPTIONS = [
  { value: "0", label: "Desativado" },
  { value: "30000", label: "30 segundos" },
  { value: "60000", label: "1 minuto" },
  { value: "300000", label: "5 minutos" },
  { value: "600000", label: "10 minutos" },
];

// ---------------------------------------------------------------------------
// LimitInput — number input with min/max clamp. Unlike web (which uses a
// native number input and a small hint), mobile uses the styled Input.
// ---------------------------------------------------------------------------

export function LimitInput({
  value,
  onChange,
  min = 5,
  max = 200,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, color: colors.foreground }}>Limite de linhas</Text>
      <Input
        keyboardType="number-pad"
        value={String(value)}
        onChangeText={(text) => {
          const n = Number(text.replace(/[^0-9]/g, ""));
          if (!Number.isFinite(n)) return;
          onChange(Math.max(min, Math.min(max, Math.floor(n))));
        }}
      />
      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
        Entre {min} e {max} linhas.
      </Text>
    </View>
  );
}

// Re-export Combobox to keep the same import surface as the web _shared file
// for widgets that use a select control.
export { Combobox };
