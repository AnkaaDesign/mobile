import * as React from "react";
import { View, ViewStyle, ScrollView } from "react-native";
import { SkeletonCard } from "./loading";
import { spacing } from "@/constants/design-system";

export interface DetailPageSkeletonProps {
  /**
   * Number of content cards to display (default: 3)
   */
  cardCount?: number;
  /**
   * Whether to show the header card (default: true)
   */
  showHeader?: boolean;
  /**
   * Whether to show the changelog/timeline card at bottom (default: false)
   */
  showChangelog?: boolean;
  /**
   * Custom heights for each card section
   */
  cardHeights?: {
    header?: number;
    main?: number[];
    changelog?: number;
  };
  /**
   * Container style
   */
  style?: ViewStyle;
}

/**
 * Standardized skeleton loader for detail pages.
 * Uses the simple card stack approach for consistency and maintainability.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DetailPageSkeleton />
 *
 * // With custom card count
 * <DetailPageSkeleton cardCount={4} />
 *
 * // With changelog section
 * <DetailPageSkeleton showChangelog={true} />
 *
 * // With custom heights
 * <DetailPageSkeleton
 *   cardHeights={{
 *     header: 120,
 *     main: [200, 150, 180],
 *     changelog: 300
 *   }}
 * />
 * ```
 */
export function DetailPageSkeleton({
  cardCount = 3,
  showHeader = true,
  showChangelog = false,
  cardHeights = {
    header: 100,
    main: [200, 150, 200],
    changelog: 300,
  },
  style,
}: DetailPageSkeletonProps) {
  const containerStyles: ViewStyle = {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2, // Extra space for bottom navigation
    gap: spacing.lg,
    ...style,
  };

  // Ensure we have enough heights for all cards
  const mainCardHeights = Array.isArray(cardHeights.main)
    ? cardHeights.main
    : Array(cardCount).fill(200);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={containerStyles}>
        {/* Header Card */}
        {showHeader && (
          <SkeletonCard style={{ height: cardHeights.header || 100 }} />
        )}

        {/* Main Content Cards */}
        {Array.from({ length: cardCount }, (_, i) => (
          <SkeletonCard
            key={`card-${i}`}
            style={{ height: mainCardHeights[i] || 200 }}
          />
        ))}

        {/* Changelog/Timeline Card */}
        {showChangelog && (
          <SkeletonCard style={{ height: cardHeights.changelog || 300 }} />
        )}
      </View>
    </ScrollView>
  );
}

DetailPageSkeleton.displayName = "DetailPageSkeleton";
