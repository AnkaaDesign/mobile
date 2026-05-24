// Shared widget primitives for the mobile dashboard. Mirror of
// `web/src/dashboard/widgets/_shared.tsx`, adapted for React Native:
//   - No HTML / Tailwind grid; styles inline on `useTheme().colors`.
//   - `Section` is a custom collapsible (animated chevron rotate). Web uses
//     `<Collapsible>`; we re-implement to control the open-state easing.
//   - `ToggleRow` uses a native Switch — touch-friendlier than web's Sim/Não
//     combobox and saves vertical space inside a sheet.
//
// Density utility values are interchangeable with web's so the same persisted
// config validates against the same Zod schema across platforms. Padding /
// text values are pixel numbers (RN style objects), not class strings.
//
// PUBLIC API (one-line summary, alphabetical):
//   AccentDot               coloured dot used as a row prefix
//   ColumnPickerSection     existing column-rename + show/hide picker
//   computeBodyMaxHeight    body-height budget given `WidgetRows`
//   ConfigTitleInput        single "Título" input used by every widget config
//   densityClasses          row padding/font-size for table widgets
//   cardDensityClasses      same for card-list widgets
//   DENSITY_OPTIONS         Combobox options for density
//   DENSITY_VALUES          tuple of valid density tokens
//   EmptyState              centered "Nada encontrado" placeholder
//   Field                   label + control + helper combo (alias of LabeledField)
//   formatBRL / formatCount / formatDate / formatRelativeDate / formatTime
//   HelpText                small muted helper paragraph
//   LabeledField            label + control + optional helper text
//   LimitInput              5–200 number input (table row limit)
//   makeTableDisplaySchema  Zod factory for `display: { density, striping... }`
//   makeTableSortSchema     Zod factory for single-key sort schema
//   REFETCH_INTERVAL_OPTIONS Combobox options for the refetch combobox
//   Section                 collapsible bordered config card
//   SectionGroup            wraps Sections so only one is open at a time (accordion)
//   SORT_DIRECTION_OPTIONS  Combobox options for asc / desc
//   SubSection              nested heading inside a Section (no border)
//   TableDisplay            type alias for the display schema's value
//   TABLE_DISPLAY_DEFAULTS  default display object
//   TableDisplayConfigSection  full canonical "Aparência da tabela" Section
//   TableSortConfigSection  canonical "Ordenação" Section
//   TableRefreshSection     canonical "Atualização automática" Section
//   ToggleRow               label + Switch + optional hint
//   WidgetFooter            footer link strip ("Ver todos →")
//   WidgetHeader            small header strip used inside a custom widget body
//   YES_NO_OPTIONS          [{value: "yes"|"no", label: "Sim"|"Não"}] (web parity)

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
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
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react-native";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { WIDGET_ROW_MAX_HEIGHT, type WidgetRows } from "../types";

// ---------------------------------------------------------------------------
// SectionGroup — accordion-style mutual exclusion for `Section`s.
//
// Without a wrapper, every `Section` is independently open/closed (current
// behaviour preserved for back-compat). When a `SectionGroup` wraps a tree of
// Sections, only ONE Section can be open at a time — opening another auto-
// closes the previous one. Mirrors web's `SectionGroup` from
// `web/src/dashboard/widgets/_shared.tsx`.
//
// Useful inside config modals where 8+ Sections stacked open at once produce
// an absurdly long scroll. Wrap the body in `<SectionGroup defaultOpenId={...}>`
// to opt in.
// ---------------------------------------------------------------------------

interface SectionGroupContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

const SectionGroupContext = createContext<SectionGroupContextValue | null>(
  null,
);

export function SectionGroup({
  defaultOpenId,
  children,
}: {
  defaultOpenId?: string | null;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const value = useMemo(() => ({ openId, setOpenId }), [openId]);
  return (
    <SectionGroupContext.Provider value={value}>
      {children}
    </SectionGroupContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Section — collapsible bordered card matching the web Section. We use a local
// state + animated rotate on the chevron rather than the @rn-primitives one
// because we need the icon-rotate behaviour and the primitive does not expose
// an `open` state hook.
//
// When wrapped in a `<SectionGroup>` (above), the Section's open state is
// driven by the group context — only one Section in the group can be open at
// a time. Without a group, each Section behaves independently (back-compat).
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
  const ctx = useContext(SectionGroupContext);
  const id = useId();
  const [localOpen, setLocalOpen] = useState(defaultOpen);

  const open = ctx ? ctx.openId === id : localOpen;
  const rotate = useSharedValue(open ? 180 : 0);

  // When the SectionGroup context closes us externally (because a sibling
  // Section was opened), keep the chevron animation in sync. Without this,
  // the chevron would freeze in the "open" position even though the body
  // collapsed. Skip the dependency array for `rotate` — Reanimated's shared
  // value is stable across renders.
  useEffect(() => {
    rotate.value = withTiming(open ? 180 : 0, {
      duration: 160,
      easing: Easing.inOut(Easing.ease),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chevStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const toggle = () => {
    const next = !open;
    if (ctx) {
      ctx.setOpenId(next ? id : null);
    } else {
      setLocalOpen(next);
    }
    // The effect above handles the chevron animation on `open` change.
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        // Spec §2.2 — Section frames use radius.md (6)
        borderRadius: borderRadius.md,
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
          paddingVertical: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            flex: 1,
          }}
        >
          {icon}
          <Text
            style={{
              // Spec §2.3 — Section header (config): 14/500
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
        <Text
          style={{
            fontSize: 11,
            fontWeight: "400",
            color: colors.mutedForeground,
            lineHeight: 14,
          }}
        >
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
          // Spec §2.1: ToggleRow inner gap = sm (8)
          gap: spacing.sm,
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
        <Text
          style={{
            fontSize: 11,
            fontWeight: "400",
            color: colors.mutedForeground,
            lineHeight: 14,
          }}
        >
          {hint}
        </Text>
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

// Parity with web's `YES_NO_OPTIONS` (web/src/dashboard/widgets/_shared.tsx).
// Mobile renders ToggleRow as a native Switch (more touch-friendly inside a
// sheet than a Sim/Não Combobox), so this constant is not consumed by the
// canonical ToggleRow — but it's exported so any widget that prefers a
// Combobox-style yes/no control (e.g. inside a dense grid of dropdowns) can
// use the same labels web uses, keeping cross-platform persisted configs
// readable side-by-side.
export const YES_NO_OPTIONS: Array<{ value: "yes" | "no"; label: string }> = [
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
];

// ---------------------------------------------------------------------------
// Segmented controls — the gold-standard "[1][2]" pill group.
//
// Canonical control for small enums (≤5 options) and bounded small integers.
// See WIDGET_CONFIG_SPEC.md §2.1. Single shared primitive — widgets MUST import
// these instead of redefining local NumberPill/DensityPill copies. Uses the
// outer-View-owns-chrome / inner-Pressable-is-tap-surface pattern (RN Pressable
// style-functions don't reliably apply layout props on iOS).
// ---------------------------------------------------------------------------

function SegPill({
  label,
  active,
  fill,
  onPress,
}: {
  label: string | number;
  active: boolean;
  fill?: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const outlineColor = isDark ? "rgba(217,217,217,0.28)" : "rgba(64,64,64,0.22)";
  const inactiveBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  return (
    <View
      style={{
        ...(fill ? { flex: 1 } : { minWidth: 44 }),
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : outlineColor,
        backgroundColor: active ? colors.primary : inactiveBg,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={{
          minHeight: 40,
          paddingHorizontal: 12,
          paddingVertical: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: active ? "700" : "500",
            color: active ? colors.primaryForeground : colors.foreground,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

/** Pick one of N options, rendered as a row of segmented pills. */
export function SegmentedControl<T extends string | number>({
  label,
  hint,
  options,
  value,
  onChange,
  fill = true,
}: {
  label?: string;
  hint?: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  /** Equal-width segments (default) vs min-width pills. */
  fill?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label ? (
        <Text style={{ fontSize: 12, color: colors.foreground }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {options.map((opt) => (
          <SegPill
            key={String(opt.value)}
            label={opt.label}
            active={opt.value === value}
            fill={fill}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
      {hint ? (
        <Text
          style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 14 }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Pick an integer in [min, max], rendered as a row of numbered pills. */
export function NumberPills({
  label,
  hint,
  min,
  max,
  value,
  onChange,
  fill = true,
}: {
  label?: string;
  hint?: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  fill?: boolean;
}) {
  const { colors } = useTheme();
  const nums: number[] = [];
  for (let n = min; n <= max; n += 1) nums.push(n);
  return (
    <View style={{ gap: 4 }}>
      {label ? (
        <Text style={{ fontSize: 12, color: colors.foreground }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {nums.map((n) => (
          <SegPill
            key={n}
            label={n}
            active={n === value}
            fill={fill}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
      {hint ? (
        <Text
          style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 14 }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Density picker rendered as the canonical segmented control. */
export function DensitySegmented({
  value,
  onChange,
  label = "Densidade",
}: {
  value: Density;
  onChange: (d: Density) => void;
  label?: string;
}) {
  return (
    <SegmentedControl<Density>
      label={label}
      options={[
        { value: "compact", label: "Compacta" },
        { value: "comfortable", label: "Confortável" },
        { value: "spacious", label: "Espaçosa" },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

export function densityClasses(d: Density): {
  rowPaddingY: number;
  rowPaddingX: number;
  fontSize: number;
  headerFontSize: number;
} {
  // headerFontSize is bumped to >=12 (was 10/11) to satisfy WCAG AA's 12px
  // minimum-readable-body-text guidance on mobile. The 9px hardcode in
  // _table.tsx pre-fix was below WCAG and unreadable on small phones.
  if (d === "compact") {
    return { rowPaddingY: 6, rowPaddingX: 10, fontSize: 12, headerFontSize: 12 };
  }
  if (d === "spacious") {
    return { rowPaddingY: 12, rowPaddingX: 14, fontSize: 14, headerFontSize: 13 };
  }
  return { rowPaddingY: 8, rowPaddingX: 12, fontSize: 13, headerFontSize: 12 };
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
// Header height: 36 (h-9 — fixed, matches web).
// Footer height: 28 (h-7 — fixed in widget-card.tsx, matches web).
// Margin: 4px slack so the bottom border doesn't get clipped.
// ---------------------------------------------------------------------------

export function computeBodyMaxHeight(rows: WidgetRows): number {
  return WIDGET_ROW_MAX_HEIGHT[rows] - 36 - 28 - 4;
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
  showRowDot: false,
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
   *  input passes `showSearchBox={false}` to omit that toggle.
   *  `density={false}` omits the density Combobox — used by widgets that
   *  surface density via a DensityPill row in a dedicated Section instead
   *  (canonical pattern: see recent-messages.tsx). */
  features?: {
    showSearchBox?: boolean;
    density?: boolean;
  };
}

export function TableDisplayConfigSection({
  value,
  onChange,
  features = {},
}: TableDisplayConfigSectionProps) {
  const { colors } = useTheme();
  const {
    showSearchBox = true,
    density = true,
  } = features;
  const set = <K extends keyof TableDisplay>(k: K, v: TableDisplay[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <Section title="Aparência da tabela" defaultOpen>
      {density && (
        <DensitySegmented
          value={value.density}
          onChange={(d) => set("density", d)}
        />
      )}
      <ToggleRow
        label="Listras zebra"
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

// ---------------------------------------------------------------------------
// Visual primitives shared across widget BODIES (not just config modals).
// These keep custom widget renderings (favorites, recent-messages, calendars)
// visually consistent with the canonical table widgets.
// ---------------------------------------------------------------------------

/** Sub-heading rendered inside a `Section` body — no border, just a small
 *  uppercase label + an optional helper line. Used to break a long Section
 *  into named sub-groups (e.g. "Cores de prazo" inside "Aparência"). */
export function SubSection({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: colors.mutedForeground,
        }}
      >
        {title}
      </Text>
      {helper && (
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          {helper}
        </Text>
      )}
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

/** Alias of `LabeledField` — matches web's exported name "Field". Use either
 *  in new code; both are kept so existing widgets don't have to migrate. */
export const Field = LabeledField;

/** Small muted helper line used below a Section title or above a control
 *  group. Same typography as the helper text inside a `LabeledField` so the
 *  config modal reads as one form. */
export function HelpText({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        color: colors.mutedForeground,
        textAlign: align,
        lineHeight: 16,
      }}
    >
      {children}
    </Text>
  );
}

/** Small inline header rendered INSIDE a widget body (separate from the
 *  WidgetCard's outer header). Useful for sub-sections within a custom-rendered
 *  widget — e.g. recent-messages's "Hoje" / "Anteriores" buckets. */
export function WidgetHeader({
  title,
  count,
  trailing,
}: {
  title: string;
  count?: number;
  trailing?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: colors.mutedForeground,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {count != null && (
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 9999,
            backgroundColor: colors.muted,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: colors.mutedForeground,
              fontVariant: ["tabular-nums"],
            }}
          >
            {count}
          </Text>
        </View>
      )}
      {trailing}
    </View>
  );
}

/** Inline "Ver todos" link at the bottom of a custom widget body. Visually
 *  matches the WidgetCard's outer footer link so users see one consistent
 *  affordance regardless of which footer the widget renders. */
export function WidgetFooter({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: pressed ? colors.muted : "transparent",
      })}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: colors.mutedForeground,
        }}
      >
        {label}
      </Text>
      <IconChevronRight size={12} color={colors.mutedForeground} />
    </Pressable>
  );
}

/** Centered placeholder block used when a widget renders zero items.
 *  Pair with the widget's `display.emptyStateMessage` config field. */
export function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {icon}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "400",
          color: colors.mutedForeground,
          textAlign: "center",
          maxWidth: 280,
          lineHeight: 16,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

/** Small filled circle — used as a row-prefix dot (e.g. status indicator). */
export function AccentDot({
  color,
  size = 8,
}: {
  color: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers — small pure functions every widget uses. Centralising
// them here means one consistent locale (Brazilian Portuguese) and one place
// to fix month-name spelling, currency symbol drift, etc.
// ---------------------------------------------------------------------------

const PT_BR_MONTHS_FULL = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

const PT_BR_MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

function asDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Format a date as "dd/MM/yyyy" or "dd/MM" or "dd de mês". */
export function formatDate(
  d: Date | string | null | undefined,
  variant: "short" | "long" | "day-month" = "short",
): string {
  const date = asDate(d);
  if (!date) return "—";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  if (variant === "day-month") return `${dd}/${mm}`;
  if (variant === "long")
    return `${date.getDate()} de ${PT_BR_MONTHS_FULL[date.getMonth()]} de ${yyyy}`;
  return `${dd}/${mm}/${yyyy}`;
}

/** Format a date as "HH:mm". */
export function formatTime(d: Date | string | null | undefined): string {
  const date = asDate(d);
  if (!date) return "—";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Format a date as "dd MMM" (e.g. "12 mar"). */
export function formatShortDateMonth(
  d: Date | string | null | undefined,
): string {
  const date = asDate(d);
  if (!date) return "—";
  return `${String(date.getDate()).padStart(2, "0")} ${PT_BR_MONTHS_SHORT[date.getMonth()]}`;
}

/** Relative-day label: "Hoje", "Ontem", "Amanhã", "em 3 dias", "há 5 dias". */
export function formatRelativeDate(
  d: Date | string | null | undefined,
): string {
  const date = asDate(d);
  if (!date) return "—";
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff > 0) return `em ${diff} dia${diff === 1 ? "" : "s"}`;
  const abs = Math.abs(diff);
  return `há ${abs} dia${abs === 1 ? "" : "s"}`;
}

/** Format a number as Brazilian currency (`R$ 1.234,56`). */
export function formatBRL(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  // Use Intl when available (RN >= Hermes with Intl polyfill); fall back to
  // hand-rolled grouping otherwise.
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);
    const [intPart, fracPart] = abs.toFixed(2).split(".");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${sign}R$ ${grouped},${fracPart}`;
  }
}

/** Format a count: passes thousands separator (1.234, 12.345) but NEVER
 *  abbreviates — dashboard widgets show exact counts so users trust them. */
export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Format a number as percentage (`12%`, `99,5%`). Decimals only when needed. */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 0,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

/** Truncate a string to `max` characters with an ellipsis. */
export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}
