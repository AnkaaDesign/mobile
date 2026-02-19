import * as React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { Skeleton } from "./skeleton";
import { spacing, borderRadius } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { useTheme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormCardConfig {
  /** Show a card header with icon + title (default: true) */
  title?: boolean;
  /** Width of the title skeleton (default: "40%") */
  titleWidth?: string;
  /** Number of field skeletons (label + input) to render */
  fields: number;
  /** Whether fields render in a 2-column grid or a single column (default: "single") */
  fieldLayout?: "single" | "grid";
  /** Show toggle rows instead of input fields for some items */
  toggleCount?: number;
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
// Label widths for variety
// ---------------------------------------------------------------------------
const LABEL_WIDTHS = ["30%", "40%", "25%", "35%", "45%", "28%"];

// ---------------------------------------------------------------------------
// FormSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton loader for form / edit pages.
 * Mirrors the real FormCard component structure: bordered card with
 * icon + title header, separator, and fields (label + bordered input).
 *
 * @example
 * ```tsx
 * <FormSkeleton
 *   cards={[
 *     { title: true, fields: 4 },
 *     { title: true, fields: 4, fieldLayout: "grid" },
 *     { title: true, fields: 2, toggleCount: 2 },
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
        <FormCardSkeleton key={cardIdx} card={card} colors={colors} index={cardIdx} />
      ))}

      {showActionBar && <ActionBarSkeleton colors={colors} />}
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
  index: number;
}

function FormCardSkeleton({ card, colors, index }: FormCardSkeletonProps) {
  const { title = true, titleWidth = "40%", fields, fieldLayout = "single", toggleCount = 0 } = card;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Card header — mirrors FormCard header: icon + title + border separator */}
      {title && (
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Skeleton width={20} height={20} borderRadius={4} />
            <Skeleton width={titleWidth} height={16} borderRadius={4} />
          </View>
        </View>
      )}

      {/* Card content — fields */}
      <View style={styles.cardContent}>
        {fieldLayout === "grid" ? (
          <GridFields count={fields} colors={colors} startIndex={index * 10} />
        ) : (
          <SingleFields count={fields} colors={colors} startIndex={index * 10} />
        )}

        {/* Toggle rows */}
        {Array.from({ length: toggleCount }, (_, i) => (
          <ToggleSkeleton key={`toggle-${i}`} colors={colors} labelWidth={i % 2 === 0 ? "45%" : "30%"} />
        ))}
      </View>
    </View>
  );
}

function SingleFields({ count, colors, startIndex = 0 }: { count: number; colors: ReturnType<typeof useTheme>["colors"]; startIndex?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <FieldSkeleton key={i} colors={colors} labelWidth={LABEL_WIDTHS[(startIndex + i) % LABEL_WIDTHS.length]} />
      ))}
    </>
  );
}

function GridFields({ count, colors, startIndex = 0 }: { count: number; colors: ReturnType<typeof useTheme>["colors"]; startIndex?: number }) {
  const rows = Math.ceil(count / 2);
  return (
    <>
      {Array.from({ length: rows }, (_, rowIdx) => {
        const leftIdx = rowIdx * 2;
        const rightIdx = leftIdx + 1;
        return (
          <View key={rowIdx} style={styles.gridRow}>
            <View style={styles.gridCell}>
              <FieldSkeleton colors={colors} labelWidth={LABEL_WIDTHS[(startIndex + leftIdx) % LABEL_WIDTHS.length]} />
            </View>
            {rightIdx < count ? (
              <View style={styles.gridCell}>
                <FieldSkeleton colors={colors} labelWidth={LABEL_WIDTHS[(startIndex + rightIdx) % LABEL_WIDTHS.length]} />
              </View>
            ) : (
              <View style={styles.gridCell} />
            )}
          </View>
        );
      })}
    </>
  );
}

function FieldSkeleton({ colors, labelWidth = "35%" }: { colors: ReturnType<typeof useTheme>["colors"]; labelWidth?: string }) {
  return (
    <View style={styles.field}>
      {/* Label — matches formTypography.label: fontSize 14, fontWeight 500 */}
      <Skeleton width={labelWidth} height={14} borderRadius={3} />
      {/* Input — bordered container with inner text skeleton, mirrors real input */}
      <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Skeleton width="50%" height={14} borderRadius={3} />
      </View>
    </View>
  );
}

function ToggleSkeleton({ colors, labelWidth = "40%" }: { colors: ReturnType<typeof useTheme>["colors"]; labelWidth?: string }) {
  return (
    <View style={styles.toggleRow}>
      <Skeleton width={labelWidth} height={14} borderRadius={3} />
      <Skeleton width={44} height={24} borderRadius={12} />
    </View>
  );
}

function ActionBarSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.actionBar, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {/* Cancel button skeleton */}
      <View style={[styles.actionButton, { borderColor: colors.border, borderWidth: 1, borderRadius: formLayout.buttonBorderRadius }]}>
        <Skeleton width={14} height={14} borderRadius={3} />
        <Skeleton width={60} height={14} borderRadius={3} />
      </View>
      {/* Submit button skeleton */}
      <View style={styles.actionButton}>
        <Skeleton width="100%" height={formLayout.buttonMinHeight} borderRadius={formLayout.buttonBorderRadius} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: spacing.xxl * 2,
  },
  card: {
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    padding: formSpacing.cardPadding,
    marginBottom: formSpacing.cardMarginBottom,
  },
  cardHeader: {
    paddingBottom: formSpacing.cardHeaderContentGap + 4,
    borderBottomWidth: formLayout.borderWidth,
    marginBottom: formSpacing.cardHeaderContentGap,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: formSpacing.rowGap,
  },
  cardContent: {
    gap: formSpacing.fieldGap,
  },
  field: {
    gap: formSpacing.labelInputGap,
  },
  inputContainer: {
    height: formLayout.inputHeight,
    borderRadius: formLayout.inputBorderRadius,
    borderWidth: formLayout.borderWidth,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  gridRow: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
  },
  gridCell: {
    flex: 1,
  },
  actionBar: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: formLayout.buttonMinHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
