import React, { useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import { ThemedText } from "@/components/ui/themed-text";
import { IconPalette } from "@tabler/icons-react-native";
import { spacing } from "@/constants/design-system";
import type { Paint } from "@/types";

interface PaintGridMinimizedProps {
  paints: Paint[];
  isLoading: boolean;
  onPaintPress: (paint: Paint) => void;
  onPaintPressStart?: () => void; // Called immediately on press for instant feedback
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  numColumns?: number;
}

const GRID_GAP = 6;
const PADDING = 12;

// Tablet detection threshold (lowered to support smaller tablets)
const TABLET_WIDTH_THRESHOLD = 624;

export function PaintGridMinimized({
  paints,
  isLoading,
  onPaintPress,
  onPaintPressStart,
  onEndReached,
  isFetchingNextPage,
  onRefresh,
  refreshing = false,
  numColumns: numColumnsProp = 5,
}: PaintGridMinimizedProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Use more columns on tablets (10) vs phones (5)
  const isTablet = screenWidth >= TABLET_WIDTH_THRESHOLD;
  const numColumns = isTablet ? 10 : numColumnsProp;

  // Calculate square size based on screen width and columns
  const squareSize = useMemo(() => {
    const totalGaps = GRID_GAP * (numColumns - 1);
    const availableWidth = screenWidth - PADDING * 2 - totalGaps;
    return Math.floor(availableWidth / numColumns);
  }, [screenWidth, numColumns]);

  // Row height for getItemLayout (square + gap)
  const rowHeight = squareSize + GRID_GAP;

  // Memoized getItemLayout for consistent scroll behavior
  const getItemLayout = useCallback(
    (_: any, index: number) => {
      const row = Math.floor(index / numColumns);
      return {
        length: rowHeight,
        offset: row * rowHeight,
        index,
      };
    },
    [rowHeight, numColumns]
  );

  const keyExtractor = useCallback((paint: Paint) => paint.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Paint }) => (
      <PaintSquare
        paint={item}
        size={squareSize}
        onPressStart={onPaintPressStart}
        onPress={() => onPaintPress(item)}
      />
    ),
    [squareSize, onPaintPress, onPaintPressStart]
  );

  // Memoized column wrapper style
  const columnWrapperStyle = useMemo(
    () => ({ gap: GRID_GAP }),
    []
  );

  // Memoized content container style
  const contentContainerStyle = useMemo(
    () => [styles.listContent, { gap: GRID_GAP }],
    []
  );

  if (isLoading && paints.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando catálogo...</ThemedText>
      </View>
    );
  }

  if (!paints || paints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconPalette size={48} color={colors.muted} />
        <ThemedText style={styles.emptyText}>Nenhuma tinta encontrada</ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={paints}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={`grid-${numColumns}`}
      contentContainerStyle={contentContainerStyle}
      columnWrapperStyle={columnWrapperStyle}
      getItemLayout={getItemLayout}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={60}
      windowSize={21}
      initialNumToRender={60}
      updateCellsBatchingPeriod={30}
      scrollEventThrottle={16}
      // Disable maintainVisibleContentPosition which can cause jumps
      maintainVisibleContentPosition={undefined}
      // Refresh control
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      // Footer
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
}

interface PaintSquareProps {
  paint: Paint;
  size: number;
  onPressStart?: () => void;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Memoized PaintSquare component to prevent unnecessary re-renders
const PaintSquare = React.memo(function PaintSquare({
  paint,
  size,
  onPressStart,
  onPress
}: PaintSquareProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const squareStyle = useMemo(
    () => [
      styles.square,
      {
        width: size,
        height: size,
        backgroundColor: paint.colorPreview ? "transparent" : (paint.hex || colors.muted),
        borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
      },
    ],
    [size, paint.colorPreview, paint.hex, colors.muted, isDark]
  );

  const handlePress = useCallback(() => {
    // Show loading immediately on press, then call the actual handler
    onPressStart?.();
    onPress();
  }, [onPressStart, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[squareStyle, animatedStyle]}
    >
      {paint.colorPreview ? (
        <PaintPreview
          paint={paint}
          baseColor={paint.hex || colors.muted}
          width={size}
          height={size}
          borderRadius={6}
          style={styles.preview}
        />
      ) : (
        <View
          style={[
            styles.colorFill,
            { backgroundColor: paint.hex || colors.muted },
          ]}
        />
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  listContent: {
    padding: PADDING,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    opacity: 0.6,
  },
  square: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorFill: {
    flex: 1,
    borderRadius: 6,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
});
