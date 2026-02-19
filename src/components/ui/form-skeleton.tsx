import * as React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { Skeleton } from "./skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormCardConfig {
  /** Show a card title skeleton at the top (default: true) */
  title?: boolean;
  /** Number of field skeletons (label + input) to render */
  fields: number;
  /** Whether fields render in a 2-column grid or a single column (default: "single") */
  fieldLayout?: "single" | "grid";
}

export interface FormSkeletonProps {
  /** One entry per card/section in the form */
  cards: FormCardConfig[];
  /** Show a bottom action-bar with two button skeletons (default: true) */
  showActionBar?: boolean;
  /** Outer container style */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// FormSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton loader for form / edit pages.
 *
 * @example
 * ```tsx
 * // Simple 2-card form
 * <FormSkeleton
 *   cards={[
 *     { title: true, fields: 4 },
 *     { title: true, fields: 3, fieldLayout: "grid" },
 *   ]}
 *   showActionBar
 * />
 * ```
 */
export function FormSkeleton({
  cards,
  showActionBar = true,
  style,
}: FormSkeletonProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {cards.map((card, cardIdx) => (
        <FormCardSkeleton key={cardIdx} card={card} colors={colors} />
      ))}

      {showActionBar && <ActionBarSkeleton />}
    </View>
  );
}

FormSkeleton.displayName = "FormSkeleton";

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

interface FormCardSkeletonProps {
  card: FormCardConfig;
  colors: ReturnType<typeof useTheme>["colors"];
}

function FormCardSkeleton({ card, colors }: FormCardSkeletonProps) {
  const { title = true, fields, fieldLayout = "single" } = card;

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  };

  return (
    <View style={cardStyle}>
      {title && (
        <Skeleton width="45%" height={18} />
      )}

      {fieldLayout === "grid" ? (
        <GridFields count={fields} />
      ) : (
        <SingleFields count={fields} />
      )}
    </View>
  );
}

function SingleFields({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <FieldSkeleton key={i} />
      ))}
    </>
  );
}

function GridFields({ count }: { count: number }) {
  // Pair fields into rows of 2
  const rows = Math.ceil(count / 2);
  return (
    <>
      {Array.from({ length: rows }, (_, rowIdx) => {
        const leftIdx = rowIdx * 2;
        const rightIdx = leftIdx + 1;
        return (
          <View key={rowIdx} style={styles.gridRow}>
            <View style={styles.gridCell}>
              <FieldSkeleton />
            </View>
            {rightIdx < count && (
              <View style={styles.gridCell}>
                <FieldSkeleton />
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

function FieldSkeleton() {
  return (
    <View style={styles.field}>
      {/* Label */}
      <Skeleton width="35%" height={13} style={{ marginBottom: spacing.xs }} />
      {/* Input */}
      <Skeleton width="100%" height={42} borderRadius={borderRadius.md} />
    </View>
  );
}

function ActionBarSkeleton() {
  return (
    <View style={styles.actionBar}>
      <Skeleton width="40%" height={44} borderRadius={borderRadius.md} />
      <Skeleton width="40%" height={44} borderRadius={borderRadius.md} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  field: {
    gap: spacing.xs,
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  gridCell: {
    flex: 1,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
