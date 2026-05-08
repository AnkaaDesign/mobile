// Mobile widget accent system — same data shape as web (so the same persisted
// JSON parses identically), but rendered with native primitives.
// Exposes: WidgetAccentColor / WidgetAccentIcon / WidgetBorderColor types,
// makeAccentSchema, resolveAccent, AccentPicker.
//
// Design contract:
//   - Three "summary" cards in a row (Cor / Ícone / Borda) act as the
//     trigger. Tapping any of them opens ONE bottom sheet whose top has a
//     three-tab strip (Cor / Ícone / Borda) so the user can change all three
//     aspects without closing and reopening separate sheets — cuts taps from
//     6 to 2 for a typical color+icon edit.
//   - Tab content shares one scrollable grid layout: 3 columns for colors
//     and borders (label-bearing), 4 columns for icons (icon-only). All
//     cells are square-ish, same border radius, same selected outline.
//   - Sheet snap height is 85% so all common color tokens fit in one screen.

import { type ComponentType, type ReactNode, useState } from "react";
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
import { Sheet } from "@/components/ui/sheet";
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

const ACCENT_ICON_LABEL: Record<WidgetAccentIcon, string> = {
  ClipboardText: "Lista", ClipboardList: "Itens", ClipboardCheck: "Conferido",
  Calendar: "Calendário", CalendarDue: "Prazo", Clock: "Relógio",
  Clock24: "24 horas", Hourglass: "Tempo", Check: "OK", CircleCheck: "Aprovado",
  AlertTriangle: "Alerta", Flag: "Sinalizar", Star: "Estrela", Bolt: "Ação",
  Truck: "Caminhão", Package: "Pacote", Brush: "Pincel", Palette: "Paleta",
  Receipt: "Recibo", FileText: "Documento", Tools: "Ferramentas",
  Users: "Usuários", Factory: "Fábrica", Message: "Mensagem", Bell: "Sino",
  Home: "Início", Heart: "Coração", Bookmark: "Marcador", ChartBar: "Gráfico",
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

type AccentTab = "color" | "icon" | "border";

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AccentTab>("color");

  const borderColor: WidgetBorderColor = value.borderColor ?? "none";
  const accent = resolveAccent(value);

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

  const openOnTab = (next: AccentTab) => {
    setTab(next);
    setOpen(true);
  };

  return (
    <>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <SummaryCard
          label="Cor"
          value={ACCENT_LABEL[value.color]}
          onPress={() => openOnTab("color")}
          swatch={<Swatch backgroundColor={accent.hex} />}
        />
        <SummaryCard
          label="Ícone"
          value={ACCENT_ICON_LABEL[value.icon] ?? value.icon}
          onPress={() => openOnTab("icon")}
          swatch={
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: `${accent.hex}1f`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <accent.Icon size={16} color={accent.hex} />
            </View>
          }
        />
        <SummaryCard
          label="Borda"
          value={borderColor === "none" ? "Nenhuma" : ACCENT_LABEL[borderColor]}
          onPress={() => openOnTab("border")}
          swatch={
            <BorderSwatch
              hex={borderColor === "none" ? undefined : ACCENT_HEX[borderColor]}
            />
          }
        />
      </View>

      <AccentSheet
        open={open}
        onOpenChange={setOpen}
        tab={tab}
        onTabChange={setTab}
        value={value}
        accentHex={accent.hex}
        borderColor={borderColor}
        onColorSelect={(c) => change({ color: c })}
        onIconSelect={(i) => change({ icon: i })}
        onBorderSelect={(b) => change({ borderColor: b })}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Summary card — one of the three triggers above the picker. Identical
// padding, height, and typography for all three so the row reads as one.
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  swatch,
  onPress,
}: {
  label: string;
  value: string;
  swatch: ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        gap: 6,
        padding: 12,
        minHeight: 84,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: pressed ? colors.primary : colors.border,
        backgroundColor: colors.card,
      })}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
        }}
      >
        {swatch}
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

function Swatch({ backgroundColor }: { backgroundColor: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    />
  );
}

function BorderSwatch({ hex }: { hex?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: hex ?? colors.border,
        borderStyle: hex ? "solid" : "dashed",
        backgroundColor: "transparent",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Single tabbed sheet — Cor / Ícone / Borda. Replaces three separate sheets
// so the user can change all three aspects without dismissing and reopening
// triggers. Tab strip is sticky beneath the header.
//
// snapPoints uses the percentage form expected by Sheet (NOT decimal) — the
// previous code passed `[0.6]` which evaluated to ~6px height and made the
// sheets functionally invisible on launch.
// ---------------------------------------------------------------------------

interface AccentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: AccentTab;
  onTabChange: (tab: AccentTab) => void;
  value: AccentPickerProps["value"];
  accentHex: string;
  borderColor: WidgetBorderColor;
  onColorSelect: (c: WidgetAccentColor) => void;
  onIconSelect: (i: WidgetAccentIcon) => void;
  onBorderSelect: (b: WidgetBorderColor) => void;
}

const TAB_TITLES: Record<AccentTab, { title: string; subtitle: string }> = {
  color: {
    title: "Aparência do widget",
    subtitle: "Define o ícone, a bolinha e a tonalidade do acento.",
  },
  icon: {
    title: "Aparência do widget",
    subtitle: "Aparece no canto superior do widget, ao lado do título.",
  },
  border: {
    title: "Aparência do widget",
    subtitle:
      'Aplica uma borda colorida à volta do widget. Use "Nenhuma" para desativar.',
  },
};

function AccentSheet({
  open,
  onOpenChange,
  tab,
  onTabChange,
  value,
  accentHex,
  borderColor,
  onColorSelect,
  onIconSelect,
  onBorderSelect,
}: AccentSheetProps) {
  const { colors } = useTheme();
  const meta = TAB_TITLES[tab];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[85]}>
      <PickerHeader
        title={meta.title}
        subtitle={meta.subtitle}
        onClose={() => onOpenChange(false)}
      />
      <View
        style={{
          flexDirection: "row",
          gap: 4,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <AccentTabButton
          active={tab === "color"}
          onPress={() => onTabChange("color")}
          label="Cor"
        />
        <AccentTabButton
          active={tab === "icon"}
          onPress={() => onTabChange("icon")}
          label="Ícone"
        />
        <AccentTabButton
          active={tab === "border"}
          onPress={() => onTabChange("border")}
          label="Borda"
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "color" && (
          <ColorGrid
            selected={value.color}
            options={ACCENT_COLOR_TUPLE.map((c) => ({
              value: c,
              label: ACCENT_LABEL[c],
            }))}
            onSelect={(c) => onColorSelect(c as WidgetAccentColor)}
          />
        )}
        {tab === "icon" && (
          <IconGrid
            selected={value.icon}
            accentHex={accentHex}
            onSelect={(i) => onIconSelect(i)}
          />
        )}
        {tab === "border" && (
          <ColorGrid
            selected={borderColor}
            options={[
              { value: "none", label: "Nenhuma" },
              ...ACCENT_COLOR_TUPLE.map((c) => ({
                value: c,
                label: ACCENT_LABEL[c],
              })),
            ]}
            onSelect={(c) => onBorderSelect(c as WidgetBorderColor)}
          />
        )}
      </ScrollView>
    </Sheet>
  );
}

function AccentTabButton({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
        backgroundColor: active
          ? colors.primary + "1f"
          : pressed
            ? colors.muted
            : "transparent",
      })}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? "700" : "500",
          color: active ? colors.primary : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface PickerHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

function PickerHeader({ title, subtitle, onClose }: PickerHeaderProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: "700",
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityLabel="Fechar"
          style={({ pressed }) => ({
            padding: 6,
            borderRadius: 8,
            backgroundColor: pressed ? colors.muted : "transparent",
          })}
        >
          <IconX size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
      {subtitle && (
        <Text
          style={{
            marginTop: 2,
            fontSize: 12,
            color: colors.mutedForeground,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

interface ColorGridProps {
  selected: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
}

function ColorGrid({ selected, options, onSelect }: ColorGridProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        const isNone = opt.value === "none";
        const hex = isNone ? undefined : ACCENT_HEX[opt.value as WidgetAccentColor];
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => ({
              // Three columns inside a 16-padded sheet with 8 gap.
              width: "31.5%",
              minHeight: 84,
              paddingVertical: 12,
              paddingHorizontal: 8,
              borderRadius: 10,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: pressed ? colors.muted : colors.card,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            })}
          >
            {isNone ? (
              <BorderSwatch hex={undefined} />
            ) : (
              <Swatch backgroundColor={hex as string} />
            )}
            <Text
              numberOfLines={1}
              style={{ fontSize: 11, fontWeight: "600", color: colors.foreground }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface IconGridProps {
  selected: WidgetAccentIcon;
  accentHex: string;
  onSelect: (icon: WidgetAccentIcon) => void;
}

function IconGrid({ selected, accentHex, onSelect }: IconGridProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {ACCENT_ICON_TUPLE.map((iconKey) => {
        const Comp = ICON_COMPONENTS[iconKey];
        const isSelected = iconKey === selected;
        return (
          <Pressable
            key={iconKey}
            onPress={() => onSelect(iconKey)}
            style={({ pressed }) => ({
              // Four columns inside a 16-padded sheet with 8 gap.
              width: "23%",
              aspectRatio: 1,
              borderRadius: 10,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: pressed ? colors.muted : colors.card,
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              paddingVertical: 8,
            })}
          >
            <Comp size={22} color={accentHex} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 9,
                fontWeight: "600",
                color: colors.mutedForeground,
                textAlign: "center",
                paddingHorizontal: 2,
              }}
            >
              {ACCENT_ICON_LABEL[iconKey] ?? iconKey}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
