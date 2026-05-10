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
