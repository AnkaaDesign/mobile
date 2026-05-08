// Mobile widget accent system — same data shape as web (so the same persisted
// JSON parses identically), but rendered with native primitives.
// Exposes: WidgetAccentColor / WidgetAccentIcon / WidgetBorderColor types,
// makeAccentSchema, resolveAccent, AccentPicker.

import { type ComponentType, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { z } from "zod";
import {
  IconClipboardText,
  IconClipboardList,
  IconClipboardCheck,
  IconCalendar,
  IconCalendarDue,
  IconClock,
  IconClock24,
  IconHourglass,
  IconCheck,
  IconCircleCheck,
  IconAlertTriangle,
  IconFlag,
  IconStar,
  IconBolt,
  IconTruck,
  IconPackage,
  IconBrush,
  IconPalette,
  IconReceipt,
  IconFileText,
  IconTools,
  IconUsers,
  IconBuildingFactory2,
  IconMessage,
  IconBell,
  IconHome,
  IconHeart,
  IconBookmark,
  IconChartBar,
  IconX,
} from "@tabler/icons-react-native";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { useTheme } from "@/lib/theme";

// ---------- Color tokens ----------

export type WidgetAccentColor =
  | "gray" | "slate" | "red" | "orange" | "amber" | "yellow" | "lime"
  | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo"
  | "violet" | "purple" | "fuchsia" | "pink" | "rose";

const ACCENT_HEX: Record<WidgetAccentColor, string> = {
  gray: "#6b7280",
  slate: "#64748b",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
};

const ACCENT_LABEL: Record<WidgetAccentColor, string> = {
  gray: "Cinza", slate: "Ardósia", red: "Vermelho", orange: "Laranja",
  amber: "Âmbar", yellow: "Amarelo", lime: "Lima", green: "Verde",
  emerald: "Esmeralda", teal: "Turquesa", cyan: "Ciano", sky: "Céu",
  blue: "Azul", indigo: "Índigo", violet: "Violeta", purple: "Roxo",
  fuchsia: "Fúcsia", pink: "Rosa choque", rose: "Rosa",
};

const ACCENT_COLOR_TUPLE = Object.keys(ACCENT_HEX) as [
  WidgetAccentColor,
  ...WidgetAccentColor[],
];

export type WidgetBorderColor = WidgetAccentColor | "none";
const BORDER_COLOR_TUPLE = ["none", ...ACCENT_COLOR_TUPLE] as [
  WidgetBorderColor,
  ...WidgetBorderColor[],
];

export function borderHexFor(value: WidgetBorderColor | null | undefined): string | undefined {
  if (!value || value === "none") return undefined;
  return ACCENT_HEX[value];
}

// ---------- Icon tokens ----------

export type WidgetAccentIcon =
  | "ClipboardText" | "ClipboardList" | "ClipboardCheck" | "Calendar"
  | "CalendarDue" | "Clock" | "Clock24" | "Hourglass" | "Check"
  | "CircleCheck" | "AlertTriangle" | "Flag" | "Star" | "Bolt" | "Truck"
  | "Package" | "Brush" | "Palette" | "Receipt" | "FileText" | "Tools"
  | "Users" | "Factory" | "Message" | "Bell" | "Home" | "Heart"
  | "Bookmark" | "ChartBar";

const ICON_COMPONENTS: Record<
  WidgetAccentIcon,
  ComponentType<{ size?: number; color?: string }>
> = {
  ClipboardText: IconClipboardText,
  ClipboardList: IconClipboardList,
  ClipboardCheck: IconClipboardCheck,
  Calendar: IconCalendar,
  CalendarDue: IconCalendarDue,
  Clock: IconClock,
  Clock24: IconClock24,
  Hourglass: IconHourglass,
  Check: IconCheck,
  CircleCheck: IconCircleCheck,
  AlertTriangle: IconAlertTriangle,
  Flag: IconFlag,
  Star: IconStar,
  Bolt: IconBolt,
  Truck: IconTruck,
  Package: IconPackage,
  Brush: IconBrush,
  Palette: IconPalette,
  Receipt: IconReceipt,
  FileText: IconFileText,
  Tools: IconTools,
  Users: IconUsers,
  Factory: IconBuildingFactory2,
  Message: IconMessage,
  Bell: IconBell,
  Home: IconHome,
  Heart: IconHeart,
  Bookmark: IconBookmark,
  ChartBar: IconChartBar,
};

const ACCENT_ICON_TUPLE = Object.keys(ICON_COMPONENTS) as [
  WidgetAccentIcon,
  ...WidgetAccentIcon[],
];

// ---------- Schema factory ----------

export function makeAccentSchema(defaults: {
  color: WidgetAccentColor;
  icon: WidgetAccentIcon;
  borderColor?: WidgetBorderColor;
}) {
  const fallback = {
    color: defaults.color,
    icon: defaults.icon,
    borderColor: defaults.borderColor ?? "none",
  };
  return z
    .object({
      color: z.enum(ACCENT_COLOR_TUPLE).default(defaults.color),
      icon: z.enum(ACCENT_ICON_TUPLE).default(defaults.icon),
      borderColor: z
        .enum(BORDER_COLOR_TUPLE)
        .default(defaults.borderColor ?? "none"),
    })
    .default(fallback as any);
}

// ---------- Resolution ----------

export interface ResolvedAccent {
  color: WidgetAccentColor;
  icon: WidgetAccentIcon;
  /** Hex of the resolved color — use directly in style props. */
  hex: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
}

export function resolveAccent(input?: {
  color?: WidgetAccentColor | null;
  icon?: WidgetAccentIcon | null;
}): ResolvedAccent {
  const color = (input?.color ?? "gray") as WidgetAccentColor;
  const icon = (input?.icon ?? "ClipboardText") as WidgetAccentIcon;
  return {
    color,
    icon,
    hex: ACCENT_HEX[color] ?? ACCENT_HEX.gray,
    Icon: ICON_COMPONENTS[icon] ?? ICON_COMPONENTS.ClipboardText,
  };
}

// ---------- Picker component ----------

interface AccentPickerProps {
  value: {
    color: WidgetAccentColor;
    icon: WidgetAccentIcon;
    borderColor?: WidgetBorderColor;
  };
  onChange: (next: {
    color: WidgetAccentColor;
    icon: WidgetAccentIcon;
    borderColor: WidgetBorderColor;
  }) => void;
}

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const { colors } = useTheme();
  const [colorOpen, setColorOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);

  const borderColor: WidgetBorderColor = value.borderColor ?? "none";
  const accent = resolveAccent(value);
  const Icon = accent.Icon;

  const change = (
    patch: Partial<{
      color: WidgetAccentColor;
      icon: WidgetAccentIcon;
      borderColor: WidgetBorderColor;
    }>,
  ) =>
    onChange({
      color: value.color,
      icon: value.icon,
      borderColor,
      ...patch,
    });

  const summaryButton = (
    label: string,
    swatch: React.ReactNode,
    sub: string,
    onPress: () => void,
  ) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: pressed ? colors.primary : colors.border,
        borderRadius: 8,
        backgroundColor: colors.card,
        minWidth: 0,
      })}
    >
      {swatch}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
          {label}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}
        >
          {sub}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {summaryButton(
          "Cor",
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: accent.hex,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />,
          ACCENT_LABEL[value.color],
          () => setColorOpen(true),
        )}
        {summaryButton(
          "Ícone",
          <Icon size={18} color={accent.hex} />,
          value.icon,
          () => setIconOpen(true),
        )}
        {summaryButton(
          "Borda",
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor:
                borderColor === "none" ? colors.border : ACCENT_HEX[borderColor],
              backgroundColor: "transparent",
            }}
          />,
          borderColor === "none" ? "Nenhuma" : ACCENT_LABEL[borderColor],
          () => setBorderOpen(true),
        )}
      </View>

      <ColorPickerSheet
        title="Selecione uma cor"
        open={colorOpen}
        onOpenChange={setColorOpen}
        selected={value.color}
        options={ACCENT_COLOR_TUPLE.map((c) => ({ value: c, label: ACCENT_LABEL[c] }))}
        onSelect={(c) => change({ color: c as WidgetAccentColor })}
      />

      <IconPickerSheet
        open={iconOpen}
        onOpenChange={setIconOpen}
        selected={value.icon}
        accentHex={accent.hex}
        onSelect={(i) => change({ icon: i })}
      />

      <ColorPickerSheet
        title="Selecione a cor da borda"
        open={borderOpen}
        onOpenChange={setBorderOpen}
        selected={borderColor}
        // "none" plus all accent colors
        options={[
          { value: "none", label: "Nenhuma" },
          ...ACCENT_COLOR_TUPLE.map((c) => ({ value: c, label: ACCENT_LABEL[c] })),
        ]}
        onSelect={(c) => change({ borderColor: c as WidgetBorderColor })}
      />
    </>
  );
}

interface ColorPickerSheetProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
}

function ColorPickerSheet({
  title,
  open,
  onOpenChange,
  selected,
  options,
  onSelect,
}: ColorPickerSheetProps) {
  const { colors } = useTheme();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[0.6]} dragIndicator>
      <SheetContent>
        <SheetHeader>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}
            >
              {title}
            </Text>
            <Pressable
              onPress={() => onOpenChange(false)}
              hitSlop={8}
              style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
            >
              <IconX size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </SheetHeader>
        <ScrollView contentContainerStyle={{ padding: 4, gap: 8, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {options.map((opt) => {
              const isSelected = opt.value === selected;
              const hex = opt.value === "none" ? undefined : ACCENT_HEX[opt.value as WidgetAccentColor];
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    onOpenChange(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: pressed ? colors.muted : colors.card,
                    width: "48%",
                  })}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: hex ? 1 : 2,
                      borderColor: hex ?? colors.border,
                      backgroundColor: hex ?? "transparent",
                    }}
                  />
                  <Text
                    style={{ fontSize: 12, color: colors.foreground }}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}

interface IconPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: WidgetAccentIcon;
  accentHex: string;
  onSelect: (icon: WidgetAccentIcon) => void;
}

function IconPickerSheet({
  open,
  onOpenChange,
  selected,
  accentHex,
  onSelect,
}: IconPickerSheetProps) {
  const { colors } = useTheme();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[0.7]} dragIndicator>
      <SheetContent>
        <SheetHeader>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
              Selecione um ícone
            </Text>
            <Pressable
              onPress={() => onOpenChange(false)}
              hitSlop={8}
              style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
            >
              <IconX size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </SheetHeader>
        <ScrollView contentContainerStyle={{ padding: 4, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ACCENT_ICON_TUPLE.map((iconKey) => {
              const Comp = ICON_COMPONENTS[iconKey];
              const isSelected = iconKey === selected;
              return (
                <Pressable
                  key={iconKey}
                  onPress={() => {
                    onSelect(iconKey);
                    onOpenChange(false);
                  }}
                  style={({ pressed }) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: pressed ? colors.muted : colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Comp size={22} color={accentHex} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}
