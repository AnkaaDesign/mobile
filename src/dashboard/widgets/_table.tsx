// Shared row primitives for table-style widgets on the mobile dashboard.
//
// Why this exists: every table widget (item-table, task-table, borrow-table,
// installment-table, ppe-delivery-table) used to render rows directly inside
// a bare <View>{children}</View>. That meant:
//   - Row separators ran flush to the card edges (no inset).
//   - Press-state backgrounds bled to the card edges.
//   - Search inputs sat in their own padded box but rows did not, so the
//     first row looked "stuck under" the search bar with no breathing room.
//   - In dark mode, colors.border (#383838) was too close to colors.card
//     (#262626) for row dividers to be visible — rows blurred together.
// This file fixes all of that in one place.
//
// The visual model mirrors the legacy task-deadline-list (which the user
// approved as "looks good"):
//   - Optional sticky header row with column labels (uppercase, muted bg)
//   - Zebra-striped rows (subtle rgba overlay so it works in both light/dark)
//   - Strong divider lines using a higher-contrast tone than colors.border
//
// Usage:
//   <WidgetCard bodyPadded={false} ...>
//     <WidgetTableContainer density={density}>
//       <WidgetTableSearch>{searchInput}</WidgetTableSearch>
//       <WidgetTableHeader columns={[
//         { key: "name", label: "Tarefa", flex: 1 },
//         { key: "status", label: "Status", width: 110 },
//         { key: "term", label: "Prazo", width: 90 },
//       ]} />
//       <WidgetTableRow density={density} index={i} onPress={...}>
//         ...cell views...
//       </WidgetTableRow>
//     </WidgetTableContainer>
//   </WidgetCard>

import { type ReactNode } from "react";
import { View, Text, Pressable, TextInput, type ViewStyle } from "react-native";
import { IconSearch } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { Density } from "./_shared";

const HORIZONTAL_INSET = 12;

interface WidgetTableContainerProps {
  density?: Density;
  children: ReactNode;
}

/** Outer wrapper for a table widget's rows. Adds the horizontal inset so
 *  rows, dividers and press-feedback all live inside `paddingHorizontal:12`
 *  without needing each row to repeat the value. */
export function WidgetTableContainer({
  children,
}: WidgetTableContainerProps) {
  return (
    <View style={{ paddingHorizontal: HORIZONTAL_INSET, paddingTop: 6, paddingBottom: 6 }}>
      {children}
    </View>
  );
}

interface WidgetTableSearchProps {
  bottomGap?: number;
  /** Wrap arbitrary children in the spacer (legacy mode — used when a
   *  widget needs a custom search control). */
  children?: ReactNode;
  /** Inline slim-search mode: when `value`/`onChangeText` are passed,
   *  WidgetTableSearch renders a compact 32-px-tall TextInput with a
   *  leading magnifying-glass icon — mirrors web's `h-7 text-xs` search
   *  field. Cuts ~10px off the previous default `<Input>` (42px) so the
   *  table rows have more vertical real estate. */
  value?: string;
  onChangeText?: (next: string) => void;
  placeholder?: string;
}

export function WidgetTableSearch({
  bottomGap = 8,
  children,
  value,
  onChangeText,
  placeholder = "Buscar...",
}: WidgetTableSearchProps) {
  const { colors, isDark } = useTheme();
  const inline = value !== undefined && onChangeText !== undefined;

  return (
    <View style={{ paddingBottom: bottomGap }}>
      {inline ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 32,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)",
            paddingHorizontal: 8,
            gap: 6,
          }}
        >
          <IconSearch size={14} color={colors.mutedForeground} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              padding: 0,
              fontSize: 13,
              color: colors.foreground,
              // RN on Android sometimes adds vertical padding to TextInput;
              // explicit 0 keeps the input visually centered in 32px.
              minHeight: 0,
              textAlignVertical: "center",
              includeFontPadding: false,
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      ) : (
        children
      )}
    </View>
  );
}

// ---------- Column header ----------

export interface WidgetTableColumn {
  key: string;
  label: string;
  /** Pass `flex` for proportional column width, or `width` for fixed pixels. */
  flex?: number;
  width?: number;
  /** Text alignment for the column header AND data cells when used with `WidgetTableCell`. */
  align?: "left" | "right" | "center";
}

/**
 * Builds the per-cell style that mirrors a column's header. Every row cell
 * MUST pass through this helper instead of duplicating literal width/flex
 * values — otherwise headers and rows silently desync if anyone tweaks the
 * COLUMNS constant. Pairs with `<WidgetTableHeader columns={...}>`.
 *
 * Conditional spread for `flex`/`width`: a literal `flex: undefined` or
 * `width: undefined` in a style can collide with React Native's flex
 * resolution (Yoga sometimes treats undefined differently from "absent"
 * when sibling flex children compete for space). Only emit each key when
 * it has a real value.
 */
export function cellStyleForColumn(col: WidgetTableColumn): ViewStyle {
  const align = col.align ?? "left";
  return {
    ...(col.flex !== undefined ? { flex: col.flex } : {}),
    ...(col.width !== undefined ? { width: col.width } : {}),
    minWidth: 0,
    alignItems:
      align === "right"
        ? "flex-end"
        : align === "center"
          ? "center"
          : "flex-start",
    flexDirection: "row",
    justifyContent:
      align === "right"
        ? "flex-end"
        : align === "center"
          ? "center"
          : "flex-start",
  };
}

/**
 * Text-cell variant — same width/alignment as `cellStyleForColumn` but
 * applied as a Text style (so `numberOfLines={1}` and `textAlign` work).
 * Use this when the cell is a single Text element with no inner layout.
 */
export function textCellStyleForColumn(col: WidgetTableColumn): {
  flex?: number;
  width?: number;
  textAlign: "left" | "right" | "center";
} {
  return {
    ...(col.flex !== undefined ? { flex: col.flex } : {}),
    ...(col.width !== undefined ? { width: col.width } : {}),
    textAlign: col.align ?? "left",
  };
}

interface WidgetTableHeaderProps {
  columns: WidgetTableColumn[];
  /** When true, prepend a 12px spacer so column labels align with row cells
   *  even when rows render an 8px `rowDot` (8 + 4 marginRight = 12). Pass
   *  the same boolean as `WidgetTableRow.rowDotColor != null`. Without this,
   *  every header label sits ~12px to the LEFT of its row cells. */
  reserveRowDot?: boolean;
}

/**
 * Uppercase column-label row that sits at the top of the table — same look as
 * the legacy task-deadline-list's `LOGOMARCA / IDENTIF. / PRAZO` header.
 */
export function WidgetTableHeader({
  columns,
  reserveRowDot,
}: WidgetTableHeaderProps) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        // Negative margin so the header strip extends edge-to-edge for the
        // muted background, matching how rows render.
        marginHorizontal: -HORIZONTAL_INSET,
        paddingHorizontal: HORIZONTAL_INSET,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: dividerColor(isDark),
      }}
    >
      {reserveRowDot && (
        <View style={{ width: 8, marginRight: 4 }} />
      )}
      {columns.map((col) => (
        <Text
          key={col.key}
          numberOfLines={1}
          style={{
            ...textCellStyleForColumn(col),
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.mutedForeground,
          }}
        >
          {col.label}
        </Text>
      ))}
    </View>
  );
}

// ---------- Row ----------

interface WidgetTableRowProps {
  density?: Density;
  /** Row index — used for zebra striping and to suppress the top divider on
   *  the first row so it doesn't sit directly under the header / search box. */
  index: number;
  onPress?: () => void;
  style?: ViewStyle;
  /** When false, suppresses the zebra-striped background on odd rows. */
  striping?: boolean;
  /** When false, suppresses the divider line between rows. */
  gridLines?: boolean;
  /** When false, suppresses the press-state highlight. */
  hoverHighlight?: boolean;
  /** Optional accent dot rendered to the left of the row content. */
  rowDotColor?: string;
  children: ReactNode;
}

function rowVerticalPad(d: Density): number {
  if (d === "compact") return 8;
  if (d === "spacious") return 14;
  return 11;
}

/**
 * Returns the divider color used between rows and on the header strip.
 * Falls back to a tone that's visibly contrasted against the card background
 * in BOTH light and dark themes, since the global colors.border is calibrated
 * for borders against the page background — too subtle on top of cards.
 */
function dividerColor(isDark: boolean): string {
  return isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
}

function zebraColor(isDark: boolean): string {
  return isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
}

export function WidgetTableRow({
  density = "comfortable",
  index,
  onPress,
  style,
  striping = true,
  gridLines = true,
  hoverHighlight = true,
  rowDotColor,
  children,
}: WidgetTableRowProps) {
  const { colors, isDark } = useTheme();
  const padY = rowVerticalPad(density);
  const isOdd = index % 2 === 1;
  const baseBg = striping && isOdd ? zebraColor(isDark) : "transparent";

  const dot = rowDotColor ? (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: rowDotColor,
        marginRight: 4,
      }}
    />
  ) : null;

  if (!onPress) {
    // Same split as the Pressable branch — the outer wrapper handles edge
    // extension + zebra; the inner View handles flex layout. Keeps cells
    // resolving correctly even if a future widget renders rows without
    // onPress.
    return (
      <View
        style={{
          marginHorizontal: -HORIZONTAL_INSET,
          backgroundColor: baseBg,
          borderTopWidth: gridLines && index !== 0 ? 1 : 0,
          borderTopColor: dividerColor(isDark),
        }}
      >
        <View
          style={[
            {
              paddingHorizontal: HORIZONTAL_INSET,
              paddingVertical: padY,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            },
            style,
          ]}
        >
          {dot}
          {children}
        </View>
      </View>
    );
  }

  // The flex layout (row direction + gap + cell sizing) lives on an inner
  // View, NOT directly on the Pressable. Reason: when complex flex children
  // (like our `flex: 1` task cell competing with `width: 108` siblings) are
  // direct children of a Pressable on iOS, the cell's flex resolution can
  // collapse — siblings end up at content-size with no flex distribution,
  // and the row appears to stack vertically. Wrapping in a View whose only
  // job is the flex container fixes the resolution.
  //
  // We split baseStyle in two:
  //   - outerStyle: edge-extending (negative margin) + zebra/press bg + the
  //                 top divider — these belong on the Pressable itself so
  //                 the press-feedback background spans the row's full
  //                 visual width.
  //   - flexStyle:  the actual flex container (paddingHorizontal, padY,
  //                 flexDirection, alignItems, gap) — applied on the inner
  //                 View where children's flex properties resolve cleanly.
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: -HORIZONTAL_INSET,
        backgroundColor: hoverHighlight && pressed ? colors.muted : baseBg,
        borderTopWidth: gridLines && index !== 0 ? 1 : 0,
        borderTopColor: dividerColor(isDark),
      })}
    >
      <View
        style={[
          {
            paddingHorizontal: HORIZONTAL_INSET,
            paddingVertical: padY,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          },
          style,
        ]}
      >
        {dot}
        {children}
      </View>
    </Pressable>
  );
}

// ---------- Inline message ----------

interface WidgetTableEmptyProps {
  children: ReactNode;
}

/** Standardized empty/loading/error inline message — uses card-relative
 *  padding so it sits in the same visual lane as rows. */
export function WidgetTableMessage({ children }: WidgetTableEmptyProps) {
  return (
    <View
      style={{
        paddingVertical: 20,
        paddingHorizontal: 0,
        alignItems: "center",
      }}
    >
      {children}
    </View>
  );
}
