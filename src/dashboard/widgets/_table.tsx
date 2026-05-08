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
import { View, Text, Pressable, type ViewStyle } from "react-native";
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
  children: ReactNode;
}

export function WidgetTableSearch({ bottomGap = 8, children }: WidgetTableSearchProps) {
  return <View style={{ paddingBottom: bottomGap }}>{children}</View>;
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

interface WidgetTableHeaderProps {
  columns: WidgetTableColumn[];
}

/**
 * Uppercase column-label row that sits at the top of the table — same look as
 * the legacy task-deadline-list's `LOGOMARCA / IDENTIF. / PRAZO` header.
 */
export function WidgetTableHeader({ columns }: WidgetTableHeaderProps) {
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
      {columns.map((col, i) => (
        <Text
          key={col.key}
          numberOfLines={1}
          style={{
            flex: col.flex,
            width: col.width,
            textAlign: col.align ?? "left",
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
  const baseStyle: ViewStyle = {
    marginHorizontal: -HORIZONTAL_INSET,
    paddingHorizontal: HORIZONTAL_INSET,
    paddingVertical: padY,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: baseBg,
    borderTopWidth: gridLines && index !== 0 ? 1 : 0,
    borderTopColor: dividerColor(isDark),
  };

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
    return (
      <View style={[baseStyle, style]}>
        {dot}
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        baseStyle,
        {
          backgroundColor:
            hoverHighlight && pressed ? colors.muted : baseBg,
        },
        style,
      ]}
    >
      {dot}
      {children}
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
