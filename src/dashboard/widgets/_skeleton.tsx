// Skeleton loading rows for dashboard widgets — replaces ActivityIndicator
// blocks that gave users no hint of the upcoming content shape.
//
// Two animation styles:
//   - <SkeletonRow density>: a single shimmering row (label + meta column)
//     used inside table widgets to fill the body during initial fetch.
//   - <SkeletonBlock>: a sized rectangle for ad-hoc layouts (the dashboard's
//     non-table widgets like daily-ponto and recent-messages).
//
// Animation: opacity oscillation via Animated.loop. We avoid Reanimated here
// because each widget already lives inside DraggableFlatList + an Animated.View
// jiggle wrapper, and stacking three Reanimated worklet trees deep was the
// source of an iOS portaling bug we already documented. RN's built-in Animated
// is good enough for a 1-prop opacity loop.

import { useEffect, useRef } from "react";
import { Animated, View, Easing } from "react-native";
import { useTheme } from "@/lib/theme";
import { densityClasses, type Density } from "./_shared";

interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
}

/** Single shimmering rectangle. Use this when the widget body isn't a table
 *  (e.g. quick-budget form fields, recent-messages cards). */
export function SkeletonBlock({
  width = "100%",
  height = 12,
  borderRadius = 4,
  style,
}: SkeletonBlockProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: colors.muted,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonRowProps {
  density?: Density;
  /** When true, render a 2-line stack (primary + meta) — typical for
   *  list-style table rows. Defaults to true. */
  twoLine?: boolean;
}

/** Drop-in replacement for `<ActivityIndicator />` inside a table widget's
 *  body: renders one row-shaped skeleton block sized to the density. */
export function SkeletonRow({ density = "comfortable", twoLine = true }: SkeletonRowProps) {
  const { rowPaddingY, rowPaddingX } = densityClasses(density);
  return (
    <View
      style={{
        paddingVertical: rowPaddingY,
        paddingHorizontal: rowPaddingX,
        gap: 6,
      }}
    >
      <SkeletonBlock width="65%" height={12} borderRadius={4} />
      {twoLine && <SkeletonBlock width="40%" height={10} borderRadius={4} />}
    </View>
  );
}

interface SkeletonRowsProps {
  count?: number;
  density?: Density;
  twoLine?: boolean;
}

/** Stack of `count` SkeletonRow components — convenience wrapper for the
 *  common "show N placeholder rows while data loads" pattern. */
export function SkeletonRows({ count = 5, density = "comfortable", twoLine = true }: SkeletonRowsProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} density={density} twoLine={twoLine} />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  density?: Density;
}

/** Card-shape skeleton — one rounded box with a header band and two body
 *  lines. Used by card-list widgets (favorites, recent-messages) where rows
 *  visually behave as standalone cards rather than table rows. */
export function SkeletonCard({ density = "comfortable" }: SkeletonCardProps) {
  const { colors } = useTheme();
  const padY = density === "compact" ? 8 : density === "spacious" ? 12 : 10;
  const padX = density === "compact" ? 10 : density === "spacious" ? 14 : 12;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: padY,
        paddingHorizontal: padX,
        backgroundColor: colors.card,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <SkeletonBlock width={28} height={28} borderRadius={6} />
        <View style={{ flex: 1, gap: 4 }}>
          <SkeletonBlock width="55%" height={11} borderRadius={4} />
          <SkeletonBlock width="40%" height={9} borderRadius={4} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={8} borderRadius={4} />
      <SkeletonBlock width="80%" height={8} borderRadius={4} />
    </View>
  );
}

interface SkeletonCardsProps {
  count?: number;
  density?: Density;
  /** Vertical gap between cards. Defaults to 8. */
  gap?: number;
}

/** Stack of `count` SkeletonCard components for card-list widgets. */
export function SkeletonCards({
  count = 4,
  density = "comfortable",
  gap = 8,
}: SkeletonCardsProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} density={density} />
      ))}
    </View>
  );
}

interface WidgetSkeletonProps {
  /** How many placeholder rows to render. Defaults to 5. */
  rows?: number;
  /** When true, render a small header band (matches widget header height). */
  hasHeader?: boolean;
  /** When true, render a footer band. */
  hasFooter?: boolean;
  density?: Density;
  /** Pass `"cards"` for card-list widgets (favorites, recent-messages) and
   *  `"rows"` (default) for tabular widgets. */
  variant?: "rows" | "cards";
}

/**
 * Canonical skeleton for an entire widget body — combines an optional
 * header band, N rows, and an optional footer band. Use this so every
 * widget renders a consistent loading state.
 */
export function WidgetSkeleton({
  rows = 5,
  hasHeader = false,
  hasFooter = false,
  density = "comfortable",
  variant = "rows",
}: WidgetSkeletonProps) {
  return (
    <View style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
      {hasHeader && (
        <View
          style={{
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <SkeletonBlock width="40%" height={12} borderRadius={4} />
          <View style={{ flex: 1 }} />
          <SkeletonBlock width={32} height={14} borderRadius={4} />
        </View>
      )}
      {variant === "cards" ? (
        <SkeletonCards count={rows} density={density} />
      ) : (
        <SkeletonRows count={rows} density={density} />
      )}
      {hasFooter && (
        <View style={{ alignItems: "center", paddingVertical: 6 }}>
          <SkeletonBlock width="35%" height={10} borderRadius={4} />
        </View>
      )}
    </View>
  );
}
