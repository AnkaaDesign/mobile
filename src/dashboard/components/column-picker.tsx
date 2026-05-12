// ColumnPicker — mobile equivalent of web/src/dashboard/components/column-picker.tsx,
// adapted for touch and bottom-sheet contexts (spec §5.1).
//
// Reorder is long-press-drag via `react-native-draggable-flatlist`. The drag
// handle (IconGripVertical) on the left of each visible row is the activator —
// users press-and-hold it for ~150ms to start dragging the row. Hidden rows
// don't participate in the draggable list; they render as a static section
// below a divider, in catalog order, with no grip.
//
// Feature parity with web's ColumnPicker:
//   - Visible columns on top in their stored order; hidden below a divider in
//     catalog order.
//   - Per-row checkbox visibility toggle.
//   - Optional rename input when `labelOverrides` + `onLabelChange` are
//     provided (becomes a TextInput pre-filled with the override).
//   - Optional sort chip per visible row (NÃO → ASC → DESC → NÃO cycle)
//     when `sorts` + `onSortsChange` are provided. Mirrors web's chip:
//     priority badge + direction icon + Asc/Desc label.
//   - Empty state when `catalog` is empty.
//   - Helper text below mirrors web file lines 246-253 wording.
//
// Layout note (alignment): ALL rows render a fixed-width grip slot — visible
// rows get the live drag handle, hidden rows get an empty placeholder of the
// same width. That keeps checkbox / label / sort-chip columns aligned pixel-
// perfect across the visible/hidden divider.

import { useCallback, useMemo } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconRotateClockwise,
  IconColumns,
  IconGripVertical,
} from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { lightImpactHaptic } from "@/utils/haptics";
import { borderRadius } from "@/constants/design-system";

export interface ColumnDescriptor<K extends string> {
  key: K;
  label: string;
}

export interface ColumnSort<K extends string> {
  key: K;
  direction: "asc" | "desc";
}

export interface ColumnPickerProps<K extends string> {
  catalog: ColumnDescriptor<K>[];
  selected: K[];
  onChange: (next: K[]) => void;
  /**
   * Optional map of custom header-label overrides keyed by column key.
   * When provided alongside `onLabelChange`, each row's name becomes an
   * editable input pre-filled with the override (or empty if none).
   */
  labelOverrides?: Partial<Record<K, string>>;
  /**
   * Called whenever a row's rename input changes. The handler receives the
   * raw value and decides whether to store it (non-empty) or unset it.
   * If omitted, the rename UI is not shown.
   */
  onLabelChange?: (key: K, value: string) => void;
  /**
   * Optional ordered sort list (priority by index). When passed together with
   * `onSortsChange`, each visible row renders a sort chip on the right.
   */
  sorts?: ColumnSort<K>[];
  /**
   * Called when the user toggles direction, adds, or removes a sort. The
   * handler should replace the entire list. Required (alongside `sorts`) to
   * enable the sort chip column.
   */
  onSortsChange?: (next: ColumnSort<K>[]) => void;
  /**
   * Maximum number of simultaneous sort columns. Defaults to 5 (matching web).
   * Once reached, empty chips become disabled. Set to 0 / negative to remove
   * the cap.
   */
  maxSorts?: number;
  /**
   * Minimum number of visible columns. Default 1 — never allow zero.
   */
  minVisible?: number;
  /**
   * Optional title shown in the header strip. Defaults to "Colunas".
   */
  title?: string;
}

export function ColumnPicker<K extends string>({
  catalog,
  selected,
  onChange,
  labelOverrides,
  onLabelChange,
  sorts,
  onSortsChange,
  maxSorts = 5,
  minVisible = 1,
  title = "Colunas",
}: ColumnPickerProps<K>) {
  const { colors } = useTheme();
  const renameEnabled = typeof onLabelChange === "function";
  const sortEnabled =
    Array.isArray(sorts) && typeof onSortsChange === "function";

  const byKey = useMemo(() => {
    const m = new Map<K, ColumnDescriptor<K>>();
    for (const c of catalog) m.set(c.key, c);
    return m;
  }, [catalog]);

  // Visible (selected) keys in stored order — feeds the draggable list.
  // Hidden keys in catalog order — feeds the static section below.
  const visibleKeys = useMemo<K[]>(
    () => selected.filter((k) => byKey.has(k)),
    [selected, byKey],
  );
  const hiddenKeys = useMemo<K[]>(() => {
    const selectedSet = new Set(selected);
    return catalog.filter((c) => !selectedSet.has(c.key)).map((c) => c.key);
  }, [catalog, selected]);

  const sortIndex = useMemo(() => {
    const m = new Map<K, { priority: number; direction: "asc" | "desc" }>();
    if (sorts) {
      sorts.forEach((s, i) =>
        m.set(s.key, { priority: i + 1, direction: s.direction }),
      );
    }
    return m;
  }, [sorts]);

  const visibleCount = selected.length;
  const totalCount = catalog.length;
  const sortCapReached =
    sortEnabled && maxSorts > 0 && (sorts?.length ?? 0) >= maxSorts;

  // ----- Reorder via long-press-drag (visible rows only) -----------------
  // DraggableFlatList calls `onDragEnd` with the reordered array. The visible
  // array's order IS the stored order, so we just persist `data` directly.

  const onDragEnd = useCallback(
    ({ data }: { data: K[] }) => {
      void lightImpactHaptic();
      onChange(data);
    },
    [onChange],
  );

  const toggle = (key: K) => {
    void lightImpactHaptic();
    if (selected.includes(key)) {
      if (selected.length <= minVisible) return;
      onChange(selected.filter((k) => k !== key));
      // If this column was driving sort, drop it from the sorts list too.
      if (sortEnabled && sorts?.some((s) => s.key === key)) {
        onSortsChange!(sorts!.filter((s) => s.key !== key));
      }
    } else {
      onChange([...selected, key]);
    }
  };

  const onSortChipClick = (key: K) => {
    if (!sortEnabled) return;
    void lightImpactHaptic();
    const current = sorts!;
    const existing = current.find((s) => s.key === key);
    if (!existing) {
      // NÃO → ASC: append (respect cap).
      if (maxSorts > 0 && current.length >= maxSorts) return;
      onSortsChange!([...current, { key, direction: "asc" }]);
    } else if (existing.direction === "asc") {
      // ASC → DESC: flip in place.
      onSortsChange!(
        current.map((s) =>
          s.key === key ? { ...s, direction: "desc" } : s,
        ),
      );
    } else {
      // DESC → NÃO: remove.
      onSortsChange!(current.filter((s) => s.key !== key));
    }
  };

  // ----- Empty state ----------------------------------------------------
  if (totalCount === 0) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.card,
          paddingVertical: 24,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <IconColumns size={20} color={colors.mutedForeground} />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          Nenhuma coluna disponível
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.mutedForeground,
            textAlign: "center",
          }}
        >
          Este widget não expõe colunas configuráveis.
        </Text>
      </View>
    );
  }

  // ----- Main render ----------------------------------------------------
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      {/* Title strip — paddingH 12, paddingV 10, border-bottom. Single line
          with the count badge on the right — matches web. The bulk-actions
          row (Selecionar todas / Limpar / Limpar ordenação) was removed because
          (a) it duplicated the per-row controls and (b) users found it
          cluttered. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.mutedForeground,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {title} ({visibleCount}/{totalCount})
        </Text>
      </View>

      {/* Visible rows — long-press-drag to reorder. DraggableFlatList wraps
          each row in `ScaleDecorator` so the actively-dragged tile scales up
          slightly and casts a shadow. `scrollEnabled={false}` lets the outer
          Sheet's ScrollView handle scrolling; this list is intrinsically sized
          to its content. */}
      <DraggableFlatList<K>
        data={visibleKeys}
        keyExtractor={(k) => String(k)}
        scrollEnabled={false}
        activationDistance={8}
        onDragEnd={onDragEnd}
        renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<K>) => {
          const def = byKey.get(item);
          if (!def) return null;
          const idx = getIndex() ?? 0;
          return (
            <ScaleDecorator>
              <ColumnPickerRow
                label={def.label}
                isVisible
                isFirst={idx === 0}
                isFirstHidden={false}
                canHide={selected.length > minVisible}
                drag={drag}
                dragDisabled={visibleKeys.length <= 1}
                isDragActive={isActive}
                onToggle={() => toggle(item)}
                renameEnabled={renameEnabled}
                overrideValue={(labelOverrides?.[item] as string | undefined) ?? ""}
                onRename={(v) => onLabelChange?.(item, v)}
                sortEnabled={sortEnabled}
                sortInfo={sortIndex.get(item)}
                sortCapReached={sortCapReached}
                onSortChipClick={() => onSortChipClick(item)}
              />
            </ScaleDecorator>
          );
        }}
      />

      {/* Hidden rows — static section below the visible list, separated by a
          thicker top border on the first hidden row. Order is implicit (catalog
          order) so no drag handle is exposed; the grip slot is still rendered
          as an empty placeholder so checkbox / label columns stay aligned. */}
      {hiddenKeys.map((key, idx) => {
        const def = byKey.get(key);
        if (!def) return null;
        return (
          <ColumnPickerRow
            key={key}
            label={def.label}
            isVisible={false}
            isFirst={visibleKeys.length === 0 && idx === 0}
            isFirstHidden={idx === 0}
            canHide={false}
            onToggle={() => toggle(key)}
            renameEnabled={renameEnabled}
            overrideValue={(labelOverrides?.[key] as string | undefined) ?? ""}
            onRename={(v) => onLabelChange?.(key, v)}
            sortEnabled={sortEnabled}
            sortInfo={undefined}
            sortCapReached={sortCapReached}
            onSortChipClick={() => onSortChipClick(key)}
          />
        );
      })}

      {/* Helper text — mirrors web file lines 246-253 wording. */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text
          style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 15 }}
        >
          {sortEnabled
            ? renameEnabled
              ? "Marque para exibir, mantenha pressionado o ícone à esquerda e arraste para reordenar, edite o nome do cabeçalho e use o chip à direita para definir a ordenação."
              : "Marque para exibir, mantenha pressionado o ícone à esquerda e arraste para reordenar e use o chip à direita para definir a ordenação."
            : renameEnabled
              ? "Marque para exibir, mantenha pressionado o ícone à esquerda e arraste para reordenar e edite o nome do cabeçalho diretamente em cada linha."
              : "Marque as colunas que deseja exibir. Mantenha pressionado o ícone à esquerda e arraste para reordenar — a ordem aqui define a ordem na tabela."}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ColumnPickerRow — one row in the picker. Layout (left → right):
//   [grip handle]  [checkbox]  label-or-input  [reset?]  [sort-chip-slot]
//
// EVERY row renders the same column structure — visible vs hidden rows differ
// only in whether the grip + sort chip are interactive. That keeps the checkbox
// and label columns aligned across the visible/hidden divider, which was the
// source of the alignment bug.
// ---------------------------------------------------------------------------

const GRIP_SLOT_WIDTH = 22;
const SORT_CHIP_SLOT_WIDTH = 92;

function ColumnPickerRow({
  label,
  isVisible,
  isFirst,
  isFirstHidden,
  canHide,
  drag,
  dragDisabled,
  isDragActive,
  onToggle,
  renameEnabled,
  overrideValue,
  onRename,
  sortEnabled,
  sortInfo,
  sortCapReached,
  onSortChipClick,
}: {
  label: string;
  isVisible: boolean;
  isFirst: boolean;
  isFirstHidden: boolean;
  canHide: boolean;
  /** When provided (visible rows only), invoking starts the long-press drag. */
  drag?: () => void;
  /** Disables drag activation even if `drag` is provided (e.g. single visible row). */
  dragDisabled?: boolean;
  isDragActive?: boolean;
  onToggle: () => void;
  renameEnabled: boolean;
  overrideValue: string;
  onRename: (value: string) => void;
  sortEnabled: boolean;
  sortInfo: { priority: number; direction: "asc" | "desc" } | undefined;
  sortCapReached: boolean;
  onSortChipClick: () => void;
}) {
  const { colors } = useTheme();
  const hasOverride = renameEnabled && overrideValue.trim().length > 0;
  const dragEnabled = !!drag && !dragDisabled && isVisible;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 44,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderTopWidth: isFirst ? 0 : isFirstHidden ? 2 : 1,
        borderTopColor: colors.border,
        backgroundColor: isDragActive ? colors.muted : isVisible ? colors.card : "transparent",
      }}
    >
      {/* Grip handle slot — always rendered for column alignment. Visible rows
          get an interactive IconGripVertical that starts a long-press drag.
          Hidden rows render an empty slot of the same width. */}
      <View
        style={{
          width: GRIP_SLOT_WIDTH,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isVisible && (
          <Pressable
            onLongPress={dragEnabled ? drag : undefined}
            delayLongPress={150}
            disabled={!dragEnabled}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Arrastar ${label}`}
            accessibilityState={{ disabled: !dragEnabled }}
            style={({ pressed }) => ({
              width: GRIP_SLOT_WIDTH,
              height: 28,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                pressed && dragEnabled ? colors.muted : "transparent",
              opacity: dragEnabled ? 1 : 0.3,
            })}
          >
            <IconGripVertical size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Checkbox — visibility toggle. Wrapped so its width is fixed and the
          label column starts at the same x for every row. */}
      <View
        style={{
          width: 22,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Checkbox
          checked={isVisible}
          onCheckedChange={onToggle}
          disabled={isVisible && !canHide}
          accessibilityLabel={isVisible ? `Ocultar ${label}` : `Mostrar ${label}`}
        />
      </View>

      {/* Label OR rename input. Hidden rows always show the static label so
          the user can still see what's being toggled. */}
      {renameEnabled && isVisible ? (
        <TextInput
          value={overrideValue}
          onChangeText={onRename}
          placeholder={label}
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            minHeight: 32,
            paddingHorizontal: 6,
            fontSize: 13,
            color: colors.foreground,
            backgroundColor: "transparent",
            borderRadius: borderRadius.sm,
          }}
        />
      ) : (
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: isVisible ? "600" : "400",
            color: isVisible ? colors.foreground : colors.mutedForeground,
          }}
        >
          {label}
        </Text>
      )}

      {/* Reset rename to default — visible only when an override exists. */}
      {renameEnabled && isVisible && hasOverride && (
        <Pressable
          onPress={() => onRename("")}
          accessibilityRole="button"
          accessibilityLabel={`Restaurar nome padrão de ${label}`}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 26,
            height: 26,
            borderRadius: borderRadius.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.muted : "transparent",
          })}
        >
          <IconRotateClockwise size={14} color={colors.mutedForeground} />
        </Pressable>
      )}

      {/* Sort chip slot — fixed-width container so visible/hidden rows align.
          Width (92px) was chosen to comfortably fit the chip's minWidth (70px
          for the empty state, ~78px for the active state with priority badge)
          plus its 16px horizontal padding — narrower slots caused the inner
          icon + label to wrap to two lines on mobile. */}
      {sortEnabled && (
        <View
          style={{
            width: SORT_CHIP_SLOT_WIDTH,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {isVisible && (
            <SortChip
              info={sortInfo}
              capReached={sortCapReached}
              label={label}
              onPress={onSortChipClick}
            />
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SortChip — single button cycling NÃO → ASC → DESC → NÃO. Active state shows
// priority badge + direction arrow + Asc/Desc label. Mirrors web's pill chip.
// ---------------------------------------------------------------------------

function SortChip({
  info,
  capReached,
  label,
  onPress,
}: {
  info: { priority: number; direction: "asc" | "desc" } | undefined;
  capReached: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  if (!info) {
    return (
      <Pressable
        onPress={onPress}
        disabled={capReached}
        accessibilityRole="button"
        accessibilityLabel={`Ordenar por ${label}`}
        hitSlop={4}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          flexShrink: 0,
          gap: 4,
          height: 28,
          paddingHorizontal: 10,
          borderRadius: borderRadius.md,
          borderWidth: 2,
          borderColor: pressed ? colors.primary : colors.border,
          backgroundColor: pressed ? `${colors.primary}10` : colors.card,
          opacity: capReached ? 0.3 : 1,
          justifyContent: "center",
        })}
      >
        <IconSelector size={14} color={colors.mutedForeground} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            color: colors.mutedForeground,
          }}
        >
          Não
        </Text>
      </Pressable>
    );
  }
  const DirIcon = info.direction === "asc" ? IconChevronUp : IconChevronDown;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Alternar ordenação de ${label} (atual: ${info.direction === "asc" ? "Crescente" : "Decrescente"})`}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
        gap: 4,
        height: 28,
        paddingHorizontal: 8,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: pressed ? `${colors.primary}cc` : colors.primary,
        justifyContent: "center",
      })}
    >
      <View
        style={{
          minWidth: 18,
          height: 18,
          paddingHorizontal: 4,
          borderRadius: borderRadius.sm,
          backgroundColor: `${colors.primaryForeground ?? "#fff"}33`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: colors.primaryForeground ?? "#fff",
          }}
        >
          {info.priority}
        </Text>
      </View>
      <DirIcon size={14} color={colors.primaryForeground ?? "#fff"} />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: colors.primaryForeground ?? "#fff",
        }}
      >
        {info.direction === "asc" ? "Asc" : "Desc"}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Optional: scrollable wrapper for use inside a Sheet body when the catalog
// has many entries (e.g. task-table's 41 columns). The maxHeight default is
// chosen to leave room for the modal's footer + header inside a 90% sheet.
// ---------------------------------------------------------------------------

export function ScrollableColumnPicker<K extends string>(
  props: ColumnPickerProps<K> & { maxHeight?: number },
) {
  const { maxHeight = 420, ...rest } = props;
  return (
    <ScrollView
      style={{ maxHeight }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <ColumnPicker {...rest} />
    </ScrollView>
  );
}
