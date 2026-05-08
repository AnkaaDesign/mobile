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
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  IconChevronDown,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react-native";
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
        borderRadius: 6,
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
          paddingVertical: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          {icon}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
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
// LabeledField — label + control + optional helper text. Standardises the
// label/input/helper rhythm across every widget's ConfigComponent so the
// config modal reads like one form rather than ten different ones.
// ---------------------------------------------------------------------------

export function LabeledField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.foreground,
        }}
      >
        {label}
      </Text>
      {children}
      {helper && (
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          {helper}
        </Text>
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

// ---------------------------------------------------------------------------
// computeBodyMaxHeight — given a widget's `rows` token, return the height
// budget for its scrollable body so the WidgetCard's footer ("Ver todos")
// stays visible. WidgetTile clamps the whole tile to WIDGET_ROW_MAX_HEIGHT.
// Subtracting the header and footer heights leaves the body budget.
//
// Header height: ~40 (paddingY 8 × 2 + content 24 in comfortable density).
// Footer height: 28 (fixed in widget-card.tsx).
// Margin: 4px slack so the bottom border doesn't get clipped.
// ---------------------------------------------------------------------------

import { WIDGET_ROW_MAX_HEIGHT, type WidgetRows } from "../types";

export function computeBodyMaxHeight(rows: WidgetRows): number {
  return WIDGET_ROW_MAX_HEIGHT[rows] - 40 - 28 - 4;
}

// ---------------------------------------------------------------------------
// ConfigTitleInput — every widget's ConfigComponent opens with the same 4-line
// "Título" input. Extracted here to remove ~7 copies of the same JSX block
// across the widget tree.
// ---------------------------------------------------------------------------

export function ConfigTitleInput({
  value,
  onChange,
  placeholder = "Título",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
      <Input value={value} onChangeText={onChange} placeholder={placeholder} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ColumnPickerSection — mobile-friendly equivalent of the web column-picker.
// Replaces drag-reorder (which is awkward inside a bottom sheet) with up/down
// arrow buttons. Visibility is controlled by a checkbox/Switch per row.
//
// State model: `value` is an ordered array of visible-column keys. Hidden
// columns appear below a divider and are added back to the visible list when
// toggled on. Order within the visible list is the display order in the
// rendered table.
// ---------------------------------------------------------------------------

interface ColumnPickerOption {
  key: string;
  label: string;
}

export function ColumnPickerSection({
  available,
  visible,
  onChange,
  minVisible = 1,
}: {
  available: ColumnPickerOption[];
  visible: string[];
  onChange: (next: string[]) => void;
  /** Prevent removing all columns. The user must always see at least N. */
  minVisible?: number;
}) {
  const { colors } = useTheme();

  const visibleSet = new Set(visible);
  const visibleOrdered = visible
    .map((k) => available.find((a) => a.key === k))
    .filter((a): a is ColumnPickerOption => !!a);
  const hidden = available.filter((a) => !visibleSet.has(a.key));

  const move = (key: string, direction: -1 | 1) => {
    const idx = visible.indexOf(key);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= visible.length) return;
    const next = visible.slice();
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    onChange(next);
  };

  const toggle = (key: string, makeVisible: boolean) => {
    if (makeVisible) {
      onChange([...visible, key]);
    } else {
      if (visible.length <= minVisible) return;
      onChange(visible.filter((k) => k !== key));
    }
  };

  return (
    <Section title="Colunas" defaultOpen>
      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
        Mostre, oculte e reordene as colunas exibidas no widget. Use as setas
        para mover uma coluna para cima ou para baixo.
      </Text>
      <View style={{ gap: 6 }}>
        {visibleOrdered.map((opt, idx) => (
          <ColumnPickerRow
            key={opt.key}
            label={opt.label}
            visible
            canMoveUp={idx > 0}
            canMoveDown={idx < visibleOrdered.length - 1}
            canHide={visible.length > minVisible}
            onMoveUp={() => move(opt.key, -1)}
            onMoveDown={() => move(opt.key, 1)}
            onToggle={() => toggle(opt.key, false)}
          />
        ))}
        {hidden.length > 0 && (
          <View
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              gap: 6,
            }}
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
              Ocultas
            </Text>
            {hidden.map((opt) => (
              <ColumnPickerRow
                key={opt.key}
                label={opt.label}
                visible={false}
                canMoveUp={false}
                canMoveDown={false}
                canHide
                onMoveUp={() => undefined}
                onMoveDown={() => undefined}
                onToggle={() => toggle(opt.key, true)}
              />
            ))}
          </View>
        )}
      </View>
    </Section>
  );
}

function ColumnPickerRow({
  label,
  visible,
  canMoveUp,
  canMoveDown,
  canHide,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  label: string;
  visible: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canHide: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: visible ? colors.card : "transparent",
      }}
    >
      {visible && (
        <>
          <ColumnArrowButton
            disabled={!canMoveUp}
            onPress={onMoveUp}
            up
          />
          <ColumnArrowButton
            disabled={!canMoveDown}
            onPress={onMoveDown}
          />
        </>
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: visible ? "600" : "400",
          color: visible ? colors.foreground : colors.mutedForeground,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onToggle}
        disabled={visible && !canHide}
        accessibilityLabel={visible ? "Ocultar coluna" : "Mostrar coluna"}
        hitSlop={6}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.muted : "transparent",
          opacity: visible && !canHide ? 0.4 : 1,
        })}
      >
        {visible ? (
          <IconEye size={16} color={colors.foreground} />
        ) : (
          <IconEyeOff size={16} color={colors.mutedForeground} />
        )}
      </Pressable>
    </View>
  );
}

function ColumnArrowButton({
  up,
  disabled,
  onPress,
}: {
  up?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const Icon = up ? IconArrowUp : IconArrowDown;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 26,
        height: 26,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.muted : "transparent",
        opacity: disabled ? 0.3 : 1,
      })}
    >
      <Icon size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// TableRefreshSection — wires REFETCH_INTERVAL_OPTIONS into a Combobox.
// The schema field has been declared in `makeTableDisplaySchema()` (and on
// every table widget by extension) for a long time but was never surfaced as
// a control. This section is the single place to render it; widgets just
// pass the current value + setter.
// ---------------------------------------------------------------------------

export function TableRefreshSection({
  value,
  onChange,
}: {
  /** Persisted as a string (matches the Combobox `value` type) — represents
   *  milliseconds, with "0" meaning "no auto-refresh". */
  value: string;
  onChange: (next: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Section title="Atualização automática">
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>
          Recarregar dados
        </Text>
        <Combobox
          value={value}
          onValueChange={(v: any) =>
            onChange(typeof v === "string" ? v : "0")
          }
          options={REFETCH_INTERVAL_OPTIONS}
        />
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          Define com que frequência o widget atualiza os dados em segundo
          plano. Use "Desativado" para recarregar somente ao tocar no botão
          de atualizar.
        </Text>
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Shared schema helpers — produce standard config sub-objects so every table
// widget exposes the same display/sort fields. Mirrors web's per-widget
// pattern: the schema fields exist even if a particular control is currently
// a no-op on mobile (e.g., `stickyHeader` doesn't apply to non-virtualized
// lists). Keeping the field present means saved configs round-trip cleanly.
// ---------------------------------------------------------------------------

/** Shape produced by `makeTableDisplaySchema()`. */
export interface TableDisplay {
  density: Density;
  striping: boolean;
  gridLines: boolean;
  hoverHighlight: boolean;
  stickyHeader: boolean;
  showSearchBox: boolean;
  showRowDot: boolean;
  showColumnHeaders: boolean;
  emptyStateMessage: string;
  /** Auto-refetch interval in milliseconds, persisted as string to match the
   *  Combobox value type. "0" disables auto-refetch. The widget render is
   *  responsible for translating this into useQuery's `refetchInterval`
   *  option. */
  refetchInterval: string;
}

export const TABLE_DISPLAY_DEFAULTS: TableDisplay = {
  density: "comfortable",
  striping: true,
  gridLines: true,
  hoverHighlight: true,
  stickyHeader: false,
  showSearchBox: true,
  showRowDot: true,
  showColumnHeaders: true,
  emptyStateMessage: "",
  refetchInterval: "0",
};

export function makeTableDisplaySchema(
  overrides?: Partial<TableDisplay>,
): z.ZodType<TableDisplay> {
  const merged = { ...TABLE_DISPLAY_DEFAULTS, ...(overrides ?? {}) };
  return z
    .object({
      density: z.enum(DENSITY_VALUES).default(merged.density),
      striping: z.boolean().default(merged.striping),
      gridLines: z.boolean().default(merged.gridLines),
      hoverHighlight: z.boolean().default(merged.hoverHighlight),
      stickyHeader: z.boolean().default(merged.stickyHeader),
      showSearchBox: z.boolean().default(merged.showSearchBox),
      showRowDot: z.boolean().default(merged.showRowDot),
      showColumnHeaders: z.boolean().default(merged.showColumnHeaders),
      emptyStateMessage: z.string().max(160).default(merged.emptyStateMessage),
      refetchInterval: z
        .string()
        .regex(/^\d+$/, "Intervalo inválido")
        .default(merged.refetchInterval),
    })
    .default(merged) as z.ZodType<TableDisplay>;
}

/** Sort schema: `key` is widget-specific, `direction` is universal. */
export function makeTableSortSchema<T extends string>(
  keys: readonly [T, ...T[]],
  defaultKey: T,
  defaultDir: "asc" | "desc" = "asc",
) {
  return z
    .object({
      key: z.enum(keys).default(defaultKey as any),
      direction: z.enum(["asc", "desc"]).default(defaultDir),
    })
    .default({ key: defaultKey as any, direction: defaultDir });
}

// ---------------------------------------------------------------------------
// Shared config UI sections — render a single block of toggles so every
// table widget's config form looks identical. Reduces drift across widgets
// and makes future cross-widget changes one-file edits.
// ---------------------------------------------------------------------------

interface TableDisplayConfigSectionProps {
  value: TableDisplay;
  onChange: (next: TableDisplay) => void;
  /** When set, hide irrelevant toggles. e.g., a widget without a search
   *  input passes `showSearchBox={false}` to omit that toggle. */
  features?: {
    showSearchBox?: boolean;
    showRowDot?: boolean;
  };
}

export function TableDisplayConfigSection({
  value,
  onChange,
  features = {},
}: TableDisplayConfigSectionProps) {
  const { colors } = useTheme();
  const { showSearchBox = true, showRowDot = true } = features;
  const set = <K extends keyof TableDisplay>(k: K, v: TableDisplay[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <Section title="Aparência da tabela" defaultOpen>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Densidade</Text>
        <Combobox
          value={value.density}
          onValueChange={(v: any) =>
            set("density", (typeof v === "string" ? v : "comfortable") as Density)
          }
          options={DENSITY_OPTIONS}
        />
      </View>
      <ToggleRow
        label="Listras zebra"
        hint="Alterna o fundo das linhas para facilitar a leitura."
        checked={value.striping}
        onCheckedChange={(v) => set("striping", v)}
      />
      <ToggleRow
        label="Linhas divisórias"
        checked={value.gridLines}
        onCheckedChange={(v) => set("gridLines", v)}
      />
      <ToggleRow
        label="Cabeçalho de colunas"
        hint="Linha com rótulos das colunas no topo da tabela."
        checked={value.showColumnHeaders}
        onCheckedChange={(v) => set("showColumnHeaders", v)}
      />
      {showSearchBox && (
        <ToggleRow
          label="Caixa de busca"
          checked={value.showSearchBox}
          onCheckedChange={(v) => set("showSearchBox", v)}
        />
      )}
      {showRowDot && (
        <ToggleRow
          label="Bolinha colorida"
          hint="Marca cada linha com a cor de acento."
          checked={value.showRowDot}
          onCheckedChange={(v) => set("showRowDot", v)}
        />
      )}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>
          Mensagem quando vazio
        </Text>
        <Input
          placeholder="Nenhum item encontrado"
          value={value.emptyStateMessage}
          onChangeText={(v: string) => set("emptyStateMessage", v.slice(0, 160))}
        />
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          Texto exibido quando os filtros não retornam nenhuma linha. Deixe
          em branco para usar o padrão.
        </Text>
      </View>
    </Section>
  );
}

interface TableSortConfigSectionProps {
  value: { key: string; direction: "asc" | "desc" };
  onChange: (next: { key: string; direction: "asc" | "desc" }) => void;
  /** Sort key options as Combobox-compatible {value, label} pairs. */
  keyOptions: { value: string; label: string }[];
}

export function TableSortConfigSection({
  value,
  onChange,
  keyOptions,
}: TableSortConfigSectionProps) {
  const { colors } = useTheme();
  return (
    <Section title="Ordenação">
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>
          Ordenar por
        </Text>
        <Combobox
          value={value.key}
          onValueChange={(v: any) =>
            onChange({
              ...value,
              key: typeof v === "string" ? v : keyOptions[0]?.value ?? "",
            })
          }
          options={keyOptions}
        />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Direção</Text>
        <Combobox
          value={value.direction}
          onValueChange={(v: any) =>
            onChange({
              ...value,
              direction: (typeof v === "string" ? v : "asc") as "asc" | "desc",
            })
          }
          options={SORT_DIRECTION_OPTIONS}
        />
      </View>
    </Section>
  );
}
