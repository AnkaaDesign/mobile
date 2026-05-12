// Mobile widget accent system — same data shape as web (so the same persisted
// JSON parses identically), but rendered with native primitives.
//
// Public surface (consumed across the dashboard):
//   • types       — WidgetAccentColor, WidgetAccentIcon, WidgetBorderColor,
//                   WidgetAccentShade, WidgetBorderThickness, ResolvedAccent.
//   • tables      — ACCENT_SCALES (50→950 tints), ACCENT_HEX (the 500 step
//                   shortcut), ACCENT_LABEL / ACCENT_COLOR_LABELS (alias),
//                   ACCENT_ICON_COMPONENTS, ACCENT_ICON_LABEL /
//                   ACCENT_ICON_LABELS (alias), ACCENT_COLOR_VALUES,
//                   ACCENT_ICON_VALUES, BORDER_COLOR_VALUES, ACCENT_SHADES /
//                   WIDGET_ACCENT_SHADE_VALUES (alias), ACCENT_COLOR_GROUPS,
//                   DEFAULT_WIDGET_ACCENTS.
//   • helpers     — withAlpha(), borderHexFor(), accentToneFor(),
//                   makeAccentSchema(), resolveAccent().
//   • component   — <AccentPicker /> (Cor / Ícone / Borda tabs in one sheet).
//
// Web-parity notes (intentionally kept as aliases so cross-platform helper
// code compiles on either side without if/else'ing on the constant name):
//   ACCENT_LABEL ≡ ACCENT_COLOR_LABELS (web's plural form).
//   ACCENT_ICON_LABEL ≡ ACCENT_ICON_LABELS (web's plural form).
//   ACCENT_SHADES ≡ WIDGET_ACCENT_SHADE_VALUES (web's verbose form).
//
// Design contract for the picker:
//   - Three "summary" cards in a row (Cor / Ícone / Borda) act as the
//     trigger. Tapping any of them opens ONE bottom sheet whose top has a
//     three-tab strip (Cor / Ícone / Borda) so the user can change all three
//     aspects without closing and reopening separate sheets — cuts taps from
//     6 to 2 for a typical color+icon edit.
//   - Tab content shares one scrollable grid layout: 3 columns for colors
//     and borders (label-bearing), 4 columns for icons (icon-only). All
//     cells are square-ish, same border radius, same selected outline.
//   - Sheet snap height is 85% so all common color tokens fit in one screen.
//
// Cardinal-constraints contract (MOBILE_WIDGETS_SPEC §1):
//   - No Tailwind / CSS — every visible color is either a literal hex from
//     ACCENT_SCALES or a `useTheme().colors` token.
//   - Light + dark mode parity: `accentToneFor(color, isDark)` returns a
//     dark-mode-friendly hex pair (lighter ink on dark bg, deeper ink on
//     light bg) so widgets don't need to fork their style logic by mode.

import { type ComponentType, type ReactNode, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
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
  // Extended set — added 2026-05-10 per user feedback "the web has much
  // more icons available". Grouped by category in ACCENT_ICON_CATEGORIES.
  IconBriefcase,
  IconSettings,
  IconSearch,
  IconFilter,
  IconLock,
  IconTag,
  IconEye,
  IconTrash,
  IconShoppingCart,
  IconCurrencyDollar,
  IconAward,
  IconMail,
  IconPhone,
  IconCloud,
  IconDatabase,
  IconShield,
  IconBuilding,
  IconUser,
  IconFolder,
  IconPin,
  IconLayoutGrid,
  IconCar,
  IconCircleX,
  IconCircleMinus,
  IconCirclePlus,
  IconInfoCircle,
  IconQuestionMark,
  IconRefresh,
  IconPercentage,
} from "@tabler/icons-react-native";
import { Sheet } from "@/components/ui/sheet";
import { useTheme } from "@/lib/theme";
import { extendedColors } from "@/lib/theme/extended-colors";

// =====================================================================
// Color scales (50 → 950) — single source of truth.
// =====================================================================
//
// 12 of the 19 scales mirror `extendedColors` (the project-wide palette
// powering badges/status pills). The remaining 7 (slate, lime, cyan, sky,
// violet, fuchsia, rose) live in `extendedColors`'s gap and are tabulated
// inline here using Tailwind v3's reference values — keeping them here
// avoids forcing every consumer of `extendedColors` to widen.
//
// Touch nothing else; if a widget wants a brand color, it goes through
// `resolveAccent` / `accentToneFor` and reads from this table.

export type WidgetAccentShade =
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "950";

export const ACCENT_SHADES: readonly WidgetAccentShade[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

/**
 * Alias of `ACCENT_SHADES` — web exports `WIDGET_ACCENT_SHADE_VALUES`
 * (web/src/dashboard/components/widget-accent.tsx:2392). Aliased here so
 * cross-platform helper code that references the plural-named constant
 * keeps compiling on both sides.
 */
export const WIDGET_ACCENT_SHADE_VALUES: readonly WidgetAccentShade[] = ACCENT_SHADES;

export const DEFAULT_WIDGET_ACCENT_SHADE: WidgetAccentShade = "500";

type AccentScale = Record<WidgetAccentShade, string>;

// Pull the 12 we already maintain as `extendedColors` so changes to the
// brand palette flow into widget accents automatically.
const EXTENDED_SCALE_KEYS = [
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "emerald",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
] as const;

// Scales that aren't in `extendedColors` — Tailwind v3 reference values.
const EXTRA_SCALES: Record<string, AccentScale> = {
  slate: {
    "50": "#f8fafc",
    "100": "#f1f5f9",
    "200": "#e2e8f0",
    "300": "#cbd5e1",
    "400": "#94a3b8",
    "500": "#64748b",
    "600": "#475569",
    "700": "#334155",
    "800": "#1e293b",
    "900": "#0f172a",
    "950": "#020617",
  },
  lime: {
    "50": "#f7fee7",
    "100": "#ecfccb",
    "200": "#d9f99d",
    "300": "#bef264",
    "400": "#a3e635",
    "500": "#84cc16",
    "600": "#65a30d",
    "700": "#4d7c0f",
    "800": "#3f6212",
    "900": "#365314",
    "950": "#1a2e05",
  },
  cyan: {
    "50": "#ecfeff",
    "100": "#cffafe",
    "200": "#a5f3fc",
    "300": "#67e8f9",
    "400": "#22d3ee",
    "500": "#06b6d4",
    "600": "#0891b2",
    "700": "#0e7490",
    "800": "#155e75",
    "900": "#164e63",
    "950": "#083344",
  },
  sky: {
    "50": "#f0f9ff",
    "100": "#e0f2fe",
    "200": "#bae6fd",
    "300": "#7dd3fc",
    "400": "#38bdf8",
    "500": "#0ea5e9",
    "600": "#0284c7",
    "700": "#0369a1",
    "800": "#075985",
    "900": "#0c4a6e",
    "950": "#082f49",
  },
  violet: {
    "50": "#f5f3ff",
    "100": "#ede9fe",
    "200": "#ddd6fe",
    "300": "#c4b5fd",
    "400": "#a78bfa",
    "500": "#8b5cf6",
    "600": "#7c3aed",
    "700": "#6d28d9",
    "800": "#5b21b6",
    "900": "#4c1d95",
    "950": "#2e1065",
  },
  fuchsia: {
    "50": "#fdf4ff",
    "100": "#fae8ff",
    "200": "#f5d0fe",
    "300": "#f0abfc",
    "400": "#e879f9",
    "500": "#d946ef",
    "600": "#c026d3",
    "700": "#a21caf",
    "800": "#86198f",
    "900": "#701a75",
    "950": "#4a044e",
  },
  rose: {
    "50": "#fff1f2",
    "100": "#ffe4e6",
    "200": "#fecdd3",
    "300": "#fda4af",
    "400": "#fb7185",
    "500": "#f43f5e",
    "600": "#e11d48",
    "700": "#be123c",
    "800": "#9f1239",
    "900": "#881337",
    "950": "#4c0519",
  },
};

// Re-shape `extendedColors` into the same `Record<WidgetAccentShade,string>`
// keying. `extendedColors.gray` carries an extra "750"/"850" — drop those
// for accent purposes (we only expose the canonical 11-shade ramp).
function fromExtended(
  scale: Partial<Record<WidgetAccentShade | "750" | "850", string>>,
): AccentScale {
  return {
    "50": scale["50"]!,
    "100": scale["100"]!,
    "200": scale["200"]!,
    "300": scale["300"]!,
    "400": scale["400"]!,
    "500": scale["500"]!,
    "600": scale["600"]!,
    "700": scale["700"]!,
    "800": scale["800"]!,
    "900": scale["900"]!,
    "950": scale["950"]!,
  };
}

// ---------- Color tokens ----------

export type WidgetAccentColor =
  // Neutral
  | "gray"
  | "slate"
  // Warm
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  // Nature
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  // Cool
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  // Rich
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

export const ACCENT_COLOR_VALUES: readonly WidgetAccentColor[] = [
  "gray",
  "slate",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export const ACCENT_SCALES: Record<WidgetAccentColor, AccentScale> = {
  gray: fromExtended(extendedColors.gray),
  slate: EXTRA_SCALES.slate,
  red: fromExtended(extendedColors.red),
  orange: fromExtended(extendedColors.orange),
  amber: fromExtended(extendedColors.amber),
  yellow: fromExtended(extendedColors.yellow),
  lime: EXTRA_SCALES.lime,
  green: fromExtended(extendedColors.green),
  emerald: fromExtended(extendedColors.emerald),
  teal: fromExtended(extendedColors.teal),
  cyan: EXTRA_SCALES.cyan,
  sky: EXTRA_SCALES.sky,
  blue: fromExtended(extendedColors.blue),
  indigo: fromExtended(extendedColors.indigo),
  violet: EXTRA_SCALES.violet,
  purple: fromExtended(extendedColors.purple),
  fuchsia: EXTRA_SCALES.fuchsia,
  pink: fromExtended(extendedColors.pink),
  rose: EXTRA_SCALES.rose,
};

// 500-shade shortcut. `accent.hex` resolves to ACCENT_HEX[color] when no
// shade is supplied — the most common case — and stays cheap to read.
export const ACCENT_HEX: Record<WidgetAccentColor, string> = ACCENT_COLOR_VALUES.reduce(
  (acc, color) => {
    acc[color] = ACCENT_SCALES[color]["500"];
    return acc;
  },
  {} as Record<WidgetAccentColor, string>,
);

export const ACCENT_LABEL: Record<WidgetAccentColor, string> = {
  gray: "Cinza",
  slate: "Ardósia",
  red: "Vermelho",
  orange: "Laranja",
  amber: "Âmbar",
  yellow: "Amarelo",
  lime: "Lima",
  green: "Verde",
  emerald: "Esmeralda",
  teal: "Turquesa",
  cyan: "Ciano",
  sky: "Céu",
  blue: "Azul",
  indigo: "Índigo",
  violet: "Violeta",
  purple: "Roxo",
  fuchsia: "Fúcsia",
  pink: "Rosa choque",
  rose: "Rosa",
};

/**
 * Plural alias of `ACCENT_LABEL` — web exports `ACCENT_COLOR_LABELS`
 * (web/src/dashboard/components/widget-accent.tsx:2420). The mobile codebase
 * uses singular `ACCENT_LABEL` for brevity; this alias is kept for parity
 * with shared/cross-platform helper code.
 */
export const ACCENT_COLOR_LABELS = ACCENT_LABEL;

export type WidgetAccentColorGroup = "neutral" | "warm" | "nature" | "cool" | "rich";

export const ACCENT_COLOR_GROUPS: Record<WidgetAccentColorGroup, WidgetAccentColor[]> = {
  neutral: ["gray", "slate"],
  warm: ["red", "orange", "amber", "yellow"],
  nature: ["lime", "green", "emerald", "teal"],
  cool: ["cyan", "sky", "blue", "indigo"],
  rich: ["violet", "purple", "fuchsia", "pink", "rose"],
};

const ACCENT_COLOR_TUPLE = ACCENT_COLOR_VALUES as unknown as [
  WidgetAccentColor,
  ...WidgetAccentColor[],
];

export type WidgetBorderColor = WidgetAccentColor | "none";

export const BORDER_COLOR_VALUES: readonly WidgetBorderColor[] = [
  "none",
  ...ACCENT_COLOR_VALUES,
] as const;

const BORDER_COLOR_TUPLE = BORDER_COLOR_VALUES as unknown as [
  WidgetBorderColor,
  ...WidgetBorderColor[],
];

const ACCENT_SHADE_TUPLE = ACCENT_SHADES as unknown as [
  WidgetAccentShade,
  ...WidgetAccentShade[],
];

/**
 * Hex string for the widget's outer card border, or `undefined` when the
 * widget should fall back to `colors.border` (the "none" sentinel).
 *
 * Mobile renders the resolved hex directly via `style={{ borderColor }}`
 * — there is no class string analogue.
 */
export function borderHexFor(value: WidgetBorderColor | null | undefined): string | undefined {
  if (!value || value === "none") return undefined;
  return ACCENT_HEX[value];
}

// =====================================================================
// withAlpha — append an alpha byte to a 6-digit hex.
// =====================================================================
//
// Matches the `${hex}1f` pattern previously sprinkled across widget files.
// Centralising lets density-sensitive areas (e.g. soft tinted icon tile,
// hover surfaces) ask for a stable `tint` without copy-pasting alpha
// constants. Alpha is clamped to [0, 1] and rounded to byte precision.

export function withAlpha(hex: string, alpha: number): string {
  // Already an 8-digit hex? Replace the alpha byte.
  const base =
    hex.length === 9 ? hex.slice(0, 7) : hex.length === 4 ? expandShortHex(hex) : hex;
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `${base}${byte}`;
}

function expandShortHex(hex: string): string {
  // "#abc" → "#aabbcc"
  const r = hex[1];
  const g = hex[2];
  const b = hex[3];
  return `#${r}${r}${g}${g}${b}${b}`;
}

// =====================================================================
// accentToneFor — light/dark-aware tones for a given accent color.
// =====================================================================
//
// Web uses `text-red-700 dark:text-red-300` patterns to swap shade by
// theme. Mobile lacks a class system, so this helper returns a 4-tone
// bag with the same intent baked in:
//
//   solid  — the accent's "500" hex (mode-independent — RN's bright
//            saturated mid-shade reads well on both backgrounds).
//   ink    — text/icon foreground. Light: 700. Dark: 300. Picks a shade
//            that has good contrast against `colors.card` in either
//            theme.
//   soft   — a tinted background suitable for icon tiles or chips. Built
//            via withAlpha() rather than the 100/900 step so the same
//            hex sits cleanly on light and dark cards.
//   border — a 40%-alpha 500 — matches the web `border-X-500/40` token
//            used for left-border accents.
//
// Pass `isDark` from `useTheme()`. Callers that don't care about modes
// can ignore the return shape and just use `accent.hex`.

export interface AccentTone {
  solid: string;
  ink: string;
  soft: string;
  border: string;
}

export function accentToneFor(
  color: WidgetAccentColor,
  isDark: boolean,
): AccentTone {
  const scale = ACCENT_SCALES[color];
  return {
    solid: scale["500"],
    ink: isDark ? scale["300"] : scale["700"],
    // ~12% alpha — perceptibly tinted, still legible at 11px text on top.
    soft: withAlpha(scale["500"], isDark ? 0.18 : 0.12),
    border: withAlpha(scale["500"], 0.4),
  };
}

// ---------- Icon tokens ----------

export type WidgetAccentIcon =
  // Status
  | "Check"
  | "CircleCheck"
  | "CircleX"
  | "CircleMinus"
  | "CirclePlus"
  | "AlertTriangle"
  | "InfoCircle"
  | "QuestionMark"
  | "Flag"
  // Tempo
  | "Calendar"
  | "CalendarDue"
  | "Clock"
  | "Clock24"
  | "Hourglass"
  | "Refresh"
  // Documentos
  | "ClipboardText"
  | "ClipboardList"
  | "ClipboardCheck"
  | "FileText"
  | "Folder"
  | "Bookmark"
  | "Tag"
  // Produção
  | "Truck"
  | "Package"
  | "Brush"
  | "Palette"
  | "Tools"
  | "Factory"
  | "Car"
  // Pessoas
  | "Users"
  | "User"
  | "Heart"
  | "Star"
  // Lugares
  | "Home"
  | "Building"
  | "Pin"
  // Comunicação
  | "Message"
  | "Mail"
  | "Phone"
  | "Bell"
  // Comércio
  | "Receipt"
  | "CurrencyDollar"
  | "ShoppingCart"
  | "Award"
  | "Percentage"
  | "ChartBar"
  // Sistema
  | "Settings"
  | "Search"
  | "Filter"
  | "Lock"
  | "Eye"
  | "Trash"
  | "Cloud"
  | "Database"
  | "Shield"
  | "Briefcase"
  | "Bolt"
  | "LayoutGrid";

export const ACCENT_ICON_COMPONENTS: Record<
  WidgetAccentIcon,
  ComponentType<{ size?: number; color?: string }>
> = {
  // Status
  Check: IconCheck,
  CircleCheck: IconCircleCheck,
  CircleX: IconCircleX,
  CircleMinus: IconCircleMinus,
  CirclePlus: IconCirclePlus,
  AlertTriangle: IconAlertTriangle,
  InfoCircle: IconInfoCircle,
  QuestionMark: IconQuestionMark,
  Flag: IconFlag,
  // Tempo
  Calendar: IconCalendar,
  CalendarDue: IconCalendarDue,
  Clock: IconClock,
  Clock24: IconClock24,
  Hourglass: IconHourglass,
  Refresh: IconRefresh,
  // Documentos & Conteúdo
  ClipboardText: IconClipboardText,
  ClipboardList: IconClipboardList,
  ClipboardCheck: IconClipboardCheck,
  FileText: IconFileText,
  Folder: IconFolder,
  Bookmark: IconBookmark,
  Tag: IconTag,
  // Produção
  Truck: IconTruck,
  Package: IconPackage,
  Brush: IconBrush,
  Palette: IconPalette,
  Tools: IconTools,
  Factory: IconBuildingFactory2,
  Car: IconCar,
  // Pessoas
  Users: IconUsers,
  User: IconUser,
  Heart: IconHeart,
  Star: IconStar,
  // Lugares
  Home: IconHome,
  Building: IconBuilding,
  Pin: IconPin,
  // Comunicação
  Message: IconMessage,
  Mail: IconMail,
  Phone: IconPhone,
  Bell: IconBell,
  // Comércio & Financeiro
  Receipt: IconReceipt,
  CurrencyDollar: IconCurrencyDollar,
  ShoppingCart: IconShoppingCart,
  Award: IconAward,
  Percentage: IconPercentage,
  ChartBar: IconChartBar,
  // Sistema
  Settings: IconSettings,
  Search: IconSearch,
  Filter: IconFilter,
  Lock: IconLock,
  Eye: IconEye,
  Trash: IconTrash,
  Cloud: IconCloud,
  Database: IconDatabase,
  Shield: IconShield,
  Briefcase: IconBriefcase,
  Bolt: IconBolt,
  LayoutGrid: IconLayoutGrid,
};

export const ACCENT_ICON_LABEL: Record<WidgetAccentIcon, string> = {
  // Status
  Check: "OK",
  CircleCheck: "Aprovado",
  CircleX: "Rejeitado",
  CircleMinus: "Removido",
  CirclePlus: "Adicionar",
  AlertTriangle: "Alerta",
  InfoCircle: "Info",
  QuestionMark: "Ajuda",
  Flag: "Sinalizar",
  // Tempo
  Calendar: "Calendário",
  CalendarDue: "Prazo",
  Clock: "Relógio",
  Clock24: "24 horas",
  Hourglass: "Tempo",
  Refresh: "Atualizar",
  // Documentos
  ClipboardText: "Lista",
  ClipboardList: "Itens",
  ClipboardCheck: "Conferido",
  FileText: "Documento",
  Folder: "Pasta",
  Bookmark: "Marcador",
  Tag: "Etiqueta",
  // Produção
  Truck: "Caminhão",
  Package: "Pacote",
  Brush: "Pincel",
  Palette: "Paleta",
  Tools: "Ferramentas",
  Factory: "Fábrica",
  Car: "Carro",
  // Pessoas
  Users: "Usuários",
  User: "Usuário",
  Heart: "Coração",
  Star: "Estrela",
  // Lugares
  Home: "Início",
  Building: "Prédio",
  Pin: "Local",
  // Comunicação
  Message: "Mensagem",
  Mail: "E-mail",
  Phone: "Telefone",
  Bell: "Sino",
  // Comércio
  Receipt: "Recibo",
  CurrencyDollar: "Dólar",
  ShoppingCart: "Carrinho",
  Award: "Prêmio",
  Percentage: "Porcento",
  ChartBar: "Gráfico",
  // Sistema
  Settings: "Ajustes",
  Search: "Buscar",
  Filter: "Filtro",
  Lock: "Bloquear",
  Eye: "Visualizar",
  Trash: "Lixeira",
  Cloud: "Nuvem",
  Database: "Dados",
  Shield: "Escudo",
  Briefcase: "Trabalho",
  Bolt: "Ação",
  LayoutGrid: "Grade",
};

/**
 * Plural alias of `ACCENT_ICON_LABEL` — web exports `ACCENT_ICON_LABELS`
 * (web/src/dashboard/components/widget-accent.tsx:3337). The mobile codebase
 * uses singular `ACCENT_ICON_LABEL` for brevity; this alias is kept for
 * parity with shared/cross-platform helper code.
 */
export const ACCENT_ICON_LABELS = ACCENT_ICON_LABEL;

// Grouped icon catalog — drives the categorized IconGrid in the AccentSheet.
// Order is the visual order shown in the picker; each category renders as
// a header row followed by a 4-column tile grid of its icons.
export const ACCENT_ICON_CATEGORIES: ReadonlyArray<{
  id: string;
  label: string;
  icons: readonly WidgetAccentIcon[];
}> = [
  {
    id: "status",
    label: "Status",
    icons: [
      "Check",
      "CircleCheck",
      "CircleX",
      "CircleMinus",
      "CirclePlus",
      "AlertTriangle",
      "InfoCircle",
      "QuestionMark",
      "Flag",
    ],
  },
  {
    id: "time",
    label: "Tempo",
    icons: ["Calendar", "CalendarDue", "Clock", "Clock24", "Hourglass", "Refresh"],
  },
  {
    id: "content",
    label: "Documentos e conteúdo",
    icons: [
      "ClipboardText",
      "ClipboardList",
      "ClipboardCheck",
      "FileText",
      "Folder",
      "Bookmark",
      "Tag",
    ],
  },
  {
    id: "production",
    label: "Produção",
    icons: ["Truck", "Package", "Brush", "Palette", "Tools", "Factory", "Car"],
  },
  {
    id: "people",
    label: "Pessoas",
    icons: ["Users", "User", "Heart", "Star"],
  },
  {
    id: "places",
    label: "Lugares",
    icons: ["Home", "Building", "Pin"],
  },
  {
    id: "communication",
    label: "Comunicação",
    icons: ["Message", "Mail", "Phone", "Bell"],
  },
  {
    id: "commerce",
    label: "Comércio e financeiro",
    icons: [
      "Receipt",
      "CurrencyDollar",
      "ShoppingCart",
      "Award",
      "Percentage",
      "ChartBar",
    ],
  },
  {
    id: "system",
    label: "Sistema",
    icons: [
      "Settings",
      "Search",
      "Filter",
      "Lock",
      "Eye",
      "Trash",
      "Cloud",
      "Database",
      "Shield",
      "Briefcase",
      "Bolt",
      "LayoutGrid",
    ],
  },
] as const;

export const ACCENT_ICON_VALUES: readonly WidgetAccentIcon[] = Object.keys(
  ACCENT_ICON_COMPONENTS,
) as WidgetAccentIcon[];

const ACCENT_ICON_TUPLE = ACCENT_ICON_VALUES as unknown as [
  WidgetAccentIcon,
  ...WidgetAccentIcon[],
];

// =====================================================================
// Default accents per widget id — the visual "DNA" of each widget.
// =====================================================================
//
// Authoritative source per `MOBILE_WIDGETS_SPEC.md` §6. Widgets register
// their own `makeAccentSchema(...)` with the same defaults — this map is
// for surfaces that need a default WITHOUT instantiating the widget's
// schema (add-widget gallery preview tile, configure-modal header icon
// when the user clears the field, etc.).
//
// All 14 mobile widget ids are covered. The 4 spec-NEW widgets (hr-calendar,
// hr-requests-table, production-calendar, quick-budget) are pre-listed so
// agents 15/16 can ship without amending this file.

export interface DefaultWidgetAccent {
  color: WidgetAccentColor;
  icon: WidgetAccentIcon;
}

export const DEFAULT_WIDGET_ACCENTS: Record<string, DefaultWidgetAccent> = {
  // production
  "table.tasks": { color: "teal", icon: "ClipboardText" },
  "home.production-calendar": { color: "indigo", icon: "Calendar" },

  // hr
  "table.ppe-deliveries": { color: "amber", icon: "ClipboardCheck" },
  "table.hr-requests": { color: "indigo", icon: "Clock" },
  "home.hr-calendar": { color: "violet", icon: "Calendar" },
  "home.daily-ponto": { color: "teal", icon: "Clock24" },
  "home.time-entries": { color: "teal", icon: "Clock" },

  // inventory
  "table.items": { color: "yellow", icon: "Package" },
  "table.borrows": { color: "violet", icon: "Package" },

  // financial
  "financial.installments": { color: "blue", icon: "Receipt" },

  // other
  "quick-action.budget": { color: "emerald", icon: "Receipt" },
  "home.recent-messages": { color: "indigo", icon: "Message" },
  "home.favorites": { color: "yellow", icon: "Star" },
  "home.quick-note": { color: "amber", icon: "FileText" },
};

/**
 * Lookup the default accent for a widget id, falling back to the gray /
 * ClipboardText pair if the id isn't registered. Always returns a valid
 * accent — never null — so consumer code doesn't need to branch.
 */
export function defaultAccentForWidget(widgetId: string): DefaultWidgetAccent {
  return (
    DEFAULT_WIDGET_ACCENTS[widgetId] ?? { color: "gray", icon: "ClipboardText" }
  );
}

// =====================================================================
// Schema factory.
// =====================================================================

// Web exposes `borderThickness` ("none"|"thin"|"medium"|"thick") on its
// accent schema (web/src/dashboard/components/widget-accent.tsx:4488) as a
// vestigial optional field — the UI no longer surfaces it but persisted
// configs may still carry it. Mobile mirrors the union here so round-tripping
// a web-saved layout (if ever ported) doesn't drop the field; mobile renders
// always use a 1.5px stroke regardless of this value (no `borderWidth-N`
// equivalent in the RN-native widget-card path).
const BORDER_THICKNESS_TUPLE = [
  "none",
  "thin",
  "medium",
  "thick",
] as const;
export type WidgetBorderThickness = (typeof BORDER_THICKNESS_TUPLE)[number];

export function makeAccentSchema(defaults: {
  color: WidgetAccentColor;
  icon: WidgetAccentIcon;
  borderColor?: WidgetBorderColor;
  shade?: WidgetAccentShade;
}) {
  const fallback = {
    color: defaults.color,
    icon: defaults.icon,
    borderColor: defaults.borderColor ?? "none",
    ...(defaults.shade ? { shade: defaults.shade } : {}),
  };
  return z
    .object({
      color: z.enum(ACCENT_COLOR_TUPLE).default(defaults.color),
      icon: z.enum(ACCENT_ICON_TUPLE).default(defaults.icon),
      borderColor: z
        .enum(BORDER_COLOR_TUPLE)
        .default(defaults.borderColor ?? "none"),
      // Optional — legacy persisted configs lack `shade`. resolveAccent()
      // falls back to "500" via DEFAULT_WIDGET_ACCENT_SHADE so the runtime
      // never sees `undefined`.
      shade: z.enum(ACCENT_SHADE_TUPLE).optional(),
      // Vestigial — kept for web persisted-config round-trip parity. See
      // BORDER_THICKNESS_TUPLE above; the field is dropped at render time.
      borderThickness: z.enum(BORDER_THICKNESS_TUPLE).optional(),
    })
    .default(fallback as any);
}

// =====================================================================
// Resolution.
// =====================================================================

export interface ResolvedAccent {
  color: WidgetAccentColor;
  icon: WidgetAccentIcon;
  shade: WidgetAccentShade;
  /** Hex of the resolved color at the resolved shade — use directly in style props. */
  hex: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
}

export function resolveAccent(input?: {
  color?: WidgetAccentColor | null;
  icon?: WidgetAccentIcon | null;
  shade?: WidgetAccentShade | null;
}): ResolvedAccent {
  const color = (input?.color ?? "gray") as WidgetAccentColor;
  const icon = (input?.icon ?? "ClipboardText") as WidgetAccentIcon;
  const shade = (input?.shade ?? DEFAULT_WIDGET_ACCENT_SHADE) as WidgetAccentShade;
  const scale = ACCENT_SCALES[color] ?? ACCENT_SCALES.gray;
  return {
    color,
    icon,
    shade,
    hex: scale[shade] ?? scale["500"],
    Icon: ACCENT_ICON_COMPONENTS[icon] ?? ACCENT_ICON_COMPONENTS.ClipboardText,
  };
}

// =====================================================================
// AccentPicker — Cor / Ícone / Borda picker rendered as one tabbed sheet.
// =====================================================================

interface AccentPickerProps {
  value: {
    color: WidgetAccentColor;
    icon: WidgetAccentIcon;
    borderColor?: WidgetBorderColor;
    shade?: WidgetAccentShade;
  };
  onChange: (next: {
    color: WidgetAccentColor;
    icon: WidgetAccentIcon;
    borderColor: WidgetBorderColor;
    shade?: WidgetAccentShade;
  }) => void;
}

type AccentTab = "color" | "icon";

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
      shade: WidgetAccentShade;
    }>,
  ) =>
    onChange({
      color: value.color,
      icon: value.icon,
      borderColor,
      shade: value.shade,
      ...patch,
    });

  const openOnTab = (next: AccentTab) => {
    setTab(next);
    setOpen(true);
  };

  // Show the resolved shade after the color name when shade is meaningful
  // (i.e., the user picked a specific shade via the new ColorShadeGrid).
  // Format: "Amarelo · 500" — matches web's COR card subtitle exactly.
  const colorValueLabel = value.shade
    ? `${ACCENT_LABEL[value.color]} · ${value.shade}`
    : ACCENT_LABEL[value.color];

  return (
    <>
      {/* Two large cards mirroring web's "Acento (cor e ícone)" section.
          `alignItems: "flex-start"` is CRITICAL — without it, the default
          stretch alignment makes each flex:1 child fill the row's cross
          axis (height) which in turn fills the whole section/modal,
          producing 700px-tall cards. With flex-start, each card sizes
          to its content + minHeight only. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <SummaryCard
          label="Cor"
          value={colorValueLabel}
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
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: withAlpha(accent.hex, 0.14),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <accent.Icon size={20} color={accent.hex} />
            </View>
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
        onColorSelect={(c, s) => change({ color: c, shade: s })}
        onIconSelect={(i) => change({ icon: i })}
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
  const { colors, isDark } = useTheme();
  const outlineColor = isDark ? "rgba(217,217,217,0.28)" : "rgba(64,64,64,0.22)";
  // ALL styling (layout + chrome) on the outer View. Pressable inside is
  // a transparent tap surface that sizes to its content (NOT height:100%
  // which created an indeterminate parent-height ↔ child-content loop
  // that caused cards to stretch to fill the entire section vertically).
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: outlineColor,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 14,
          minHeight: 72,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          {swatch}
          <View style={{ flex: 1, minWidth: 0 }}>
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
            <Text
              numberOfLines={1}
              style={{
                marginTop: 2,
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              {value}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function Swatch({ backgroundColor }: { backgroundColor: string }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor,
      }}
    />
  );
}

function BorderSwatch({ hex }: { hex?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: hex ?? colors.border,
        borderStyle: hex ? "solid" : "dashed",
        backgroundColor: "transparent",
      }}
    />
  );
}

// Compact secondary control for selecting the optional accent border.
// Lives below the Cor + Ícone primary cards so those stay readable, and
// surfaces the current selection in-line — no need to open the sheet just
// to see what's set.
function BorderInlineRow({
  borderColor,
  onPress,
}: {
  borderColor: WidgetBorderColor;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const hex = borderColor === "none" ? undefined : ACCENT_HEX[borderColor];
  const outlineColor = isDark
    ? "rgba(217,217,217,0.22)"
    : "rgba(64,64,64,0.18)";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Borda: ${borderColor === "none" ? "Nenhuma" : ACCENT_LABEL[borderColor]}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: pressed ? colors.primary : outlineColor,
        backgroundColor: isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.02)",
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: hex ?? colors.border,
          borderStyle: hex ? "solid" : "dashed",
        }}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        Borda
      </Text>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: "600",
          color: colors.foreground,
        }}
      >
        {borderColor === "none" ? "Nenhuma" : ACCENT_LABEL[borderColor]}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: colors.mutedForeground,
        }}
      >
        Editar
      </Text>
    </Pressable>
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
  onColorSelect: (c: WidgetAccentColor, shade?: WidgetAccentShade) => void;
  onIconSelect: (i: WidgetAccentIcon) => void;
}

const TAB_TITLES: Record<AccentTab, { title: string; subtitle: string }> = {
  color: {
    title: "Aparência do widget",
    subtitle: "Define o ícone e a tonalidade do acento.",
  },
  icon: {
    title: "Aparência do widget",
    subtitle: "Aparece no canto superior do widget, ao lado do título.",
  },
};

function AccentSheet({
  open,
  onOpenChange,
  tab,
  onTabChange,
  value,
  accentHex,
  onColorSelect,
  onIconSelect,
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
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "color" && (
          <ColorShadeGrid
            selectedColor={value.color}
            selectedShade={value.shade ?? "500"}
            onSelect={(c, s) => onColorSelect(c, s)}
          />
        )}
        {tab === "icon" && (
          <IconGrid
            selected={value.icon}
            accentHex={accentHex}
            onSelect={(i) => onIconSelect(i)}
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
          ? withAlpha(colors.primary, 0.12)
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

// ColorShadeGrid — 12-row × 6-column matrix of color swatches (color name
// label on the left, shades 400→900 across). Mirrors web's color picker
// modal (web/src/dashboard/components/widget-accent.tsx) — the previous
// flat 19-color grid showed only the 500 shade per color and felt
// dramatically less expressive than web. Pressing any swatch emits the
// (color, shade) pair so the saved config remembers the exact tint.
//
// Layout: row label fixed at ~64px, then 6 equal-flex squares with gap 4.
// On narrow viewports (<360px) the swatches shrink proportionally — they
// stay tappable at ~38px which exceeds the 36px minimum touch target.
const SHADE_COLUMNS: readonly WidgetAccentShade[] = [
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

// Same 12-color subset web uses in the picker modal. Mobile's catalog has
// 19 colors total (gray/slate added) but the picker matrix matches web for
// visual parity — gray/slate stay available via the schema defaults.
const SHADE_COLOR_ROWS: readonly WidgetAccentColor[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

interface ColorShadeGridProps {
  selectedColor: WidgetAccentColor;
  selectedShade: WidgetAccentShade;
  onSelect: (color: WidgetAccentColor, shade: WidgetAccentShade) => void;
}

function ColorShadeGrid({
  selectedColor,
  selectedShade,
  onSelect,
}: ColorShadeGridProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {/* Column header — shade numbers (400-900). Uses the same 72px label
          gutter + 4px inter-column gap as the swatch rows below so each
          shade number sits centered over its swatch column. */}
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <View style={{ width: 72 }} />
        {SHADE_COLUMNS.map((shade) => (
          <View
            key={`hdr-${shade}`}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: colors.mutedForeground,
                fontVariant: ["tabular-nums"],
              }}
            >
              {shade}
            </Text>
          </View>
        ))}
      </View>
      {SHADE_COLOR_ROWS.map((color) => {
        const scale = ACCENT_SCALES[color];
        return (
          <View
            key={`row-${color}`}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View style={{ width: 72 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: colors.foreground,
                }}
              >
                {ACCENT_LABEL[color]}
              </Text>
            </View>
            {SHADE_COLUMNS.map((shade) => {
              const isSelected =
                color === selectedColor && shade === selectedShade;
              const hex = scale[shade] ?? scale["500"];
              // Outer View owns ALL styling — including the colored
              // backgroundColor. Pressable's style function doesn't apply
              // backgroundColor reliably on iOS in this RN version, which
              // is why the swatches rendered as empty rectangles even
              // after the flex:1 wrapper fix. Move bg to the View; the
              // Pressable inside is a transparent tap surface.
              return (
                <View
                  key={`${color}-${shade}`}
                  style={{
                    flex: 1,
                    aspectRatio: 1.4,
                    minHeight: 32,
                    borderRadius: 6,
                    backgroundColor: hex,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <Pressable
                    onPress={() => onSelect(color, shade)}
                    accessibilityRole="button"
                    accessibilityLabel={`${ACCENT_LABEL[color]} ${shade}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <IconCheck size={14} color="#ffffff" strokeWidth={3} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        );
      })}
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
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const outlineColor = isDark
    ? "rgba(217,217,217,0.22)"
    : "rgba(64,64,64,0.18)";

  // Filter each category's icons against the query. Categories that have
  // zero matches are hidden so the user never sees empty section headers.
  const visibleCategories = ACCENT_ICON_CATEGORIES.map((cat) => ({
    ...cat,
    icons: normalizedQuery
      ? cat.icons.filter((iconKey) => {
          const label = ACCENT_ICON_LABEL[iconKey] ?? iconKey;
          return (
            label.toLowerCase().includes(normalizedQuery) ||
            iconKey.toLowerCase().includes(normalizedQuery)
          );
        })
      : cat.icons,
  })).filter((cat) => cat.icons.length > 0);

  return (
    <View style={{ gap: 14 }}>
      {/* Search input — matches web's "Buscar ícone..." affordance. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          height: 40,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: outlineColor,
          backgroundColor: isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.025)",
        }}
      >
        <IconSearch size={16} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar ícone..."
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            fontSize: 14,
            color: colors.foreground,
            padding: 0,
          }}
        />
      </View>

      {visibleCategories.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
            Nenhum ícone encontrado.
          </Text>
        </View>
      ) : (
        visibleCategories.map((cat) => (
          <View key={cat.id} style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: colors.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {cat.label}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {cat.icons.map((iconKey) => {
                const Comp = ACCENT_ICON_COMPONENTS[iconKey];
                const isSelected = iconKey === selected;
                // All visual chrome (border, bg) + sizing on the OUTER
                // View — Pressable's style function fails to apply ANY
                // style on iOS in this RN version (not just layout).
                // The Pressable becomes a transparent tap surface.
                return (
                  <View
                    key={iconKey}
                    style={{
                      width: "23%",
                      aspectRatio: 1,
                      borderRadius: 10,
                      borderWidth: isSelected ? 2 : 1.5,
                      borderColor: isSelected ? colors.primary : outlineColor,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.025)",
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      onPress={() => onSelect(iconKey)}
                      accessibilityRole="button"
                      accessibilityLabel={ACCENT_ICON_LABEL[iconKey] ?? iconKey}
                      style={{
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 6,
                        paddingHorizontal: 4,
                        gap: 4,
                      }}
                    >
                      <Comp size={22} color={accentHex} />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 9,
                          fontWeight: "600",
                          color: colors.mutedForeground,
                          textAlign: "center",
                          maxWidth: "100%",
                        }}
                      >
                        {ACCENT_ICON_LABEL[iconKey] ?? iconKey}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}
