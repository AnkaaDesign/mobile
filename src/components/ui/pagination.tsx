import React, { useCallback, useRef} from "react";
import { FlatList, FlatListProps, ListRenderItem, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, TextStyle, View, ViewStyle, StyleSheet, ActivityIndicator } from "react-native";
import { Button } from "./button";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { EmptyState } from "./empty-state";
import { ErrorScreen } from "./error-screen";
import { LoadingSpinner } from "./loading";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, transitions } from "@/constants/design-system";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolate, Extrapolate } from "react-native-reanimated";

interface PaginationProps<T> extends Omit<FlatListProps<T>, "data" | "renderItem"> {
  // Data
  data: T[] | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;

  // Loading states
  isLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingMore?: boolean;

  // Pagination
  hasNextPage?: boolean;
  onLoadMore?: () => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;

  // UI Options
  loadMoreText?: string;
  loadingMoreText?: string;
  showPageIndicator?: boolean;
  currentPage?: number;
  totalPages?: number;

  // Empty/Error states
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: string;
  emptyStateActionLabel?: string;
  onEmptyStateAction?: () => void;

  error?: Error | null;
  errorTitle?: string;
  onErrorRetry?: () => void;

  // Infinite scroll
  enableInfiniteScroll?: boolean;
  infiniteScrollThreshold?: number; // 0-1, default 0.8

  // Styling
  contentContainerStyle?: ViewStyle;
  loadMoreButtonStyle?: ViewStyle;
  pageIndicatorStyle?: ViewStyle;
}

export function Pagination<T>({
  data,
  renderItem,
  keyExtractor,

  isLoading = false,
  isRefreshing = false,
  isFetchingMore = false,

  hasNextPage = false,
  onLoadMore,
  onRefresh,

  loadMoreText = "Carregar mais",
  loadingMoreText = "Carregando mais...",
  showPageIndicator = false,
  currentPage = 1,
  totalPages = 1,

  emptyStateTitle = "Nenhum item encontrado",
  emptyStateDescription = "Não há itens para exibir no momento",
  emptyStateIcon = "inbox-outline",
  emptyStateActionLabel,
  onEmptyStateAction,

  error,
  errorTitle = "Erro ao carregar dados",
  onErrorRetry,

  enableInfiniteScroll = true,
  infiniteScrollThreshold = 0.8,

  contentContainerStyle,
  loadMoreButtonStyle,
  pageIndicatorStyle,

  ...flatListProps
}: PaginationProps<T>) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList<T>>(null);
  const scrollY = useSharedValue(0);
  const isLoadingMore = useRef(false);

  // Handle scroll for infinite scroll
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;

      if (!enableInfiniteScroll || !hasNextPage || isLoadingMore.current || isFetchingMore) {
        return;
      }

      const { layoutMeasurement, contentSize, contentOffset } = event.nativeEvent;
      const paddingToBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      const threshold = layoutMeasurement.height * (1 - infiniteScrollThreshold);

      if (paddingToBottom < threshold) {
        isLoadingMore.current = true;
        onLoadMore?.();

        // Reset flag after a delay to prevent multiple calls
        setTimeout(() => {
          isLoadingMore.current = false;
        }, 1000);
      }
    },
    [enableInfiniteScroll, hasNextPage, isFetchingMore, infiniteScrollThreshold, onLoadMore],
  );

  // Page indicator animation
  const pageIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 50], [0, 1], Extrapolate.CLAMP);

    return {
      opacity: withTiming(opacity, { duration: transitions.fast }),
    };
  });

  // Loading state
  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centerContainer}>
        <LoadingSpinner size="lg" />
        <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  // Error state
  if (error && !data) {
    return <ErrorScreen message={errorTitle} detail={error.message} onRetry={onErrorRetry || onRefresh} />;
  }

  // Empty state
  const isEmpty = !data || data.length === 0;

  const renderFooter = useCallback(() => {
    if (!hasNextPage && !isFetchingMore) {
      return null;
    }

    if (isFetchingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingMoreText}>{loadingMoreText}</ThemedText>
        </View>
      );
    }

    if (!enableInfiniteScroll && hasNextPage) {
      return (
        <View style={styles.footerContainer}>
          <Button variant="secondary" size="sm" onPress={onLoadMore} disabled={isFetchingMore} style={StyleSheet.flatten([styles.loadMoreButton, loadMoreButtonStyle])}>
            {loadMoreText}
          </Button>
        </View>
      );
    }

    return null;
  }, [hasNextPage, isFetchingMore, colors.primary, loadingMoreText, enableInfiniteScroll, onLoadMore, loadMoreText, loadMoreButtonStyle]);

  const renderEmpty = () => {
    if (isEmpty && !isLoading) {
      return <EmptyState icon={emptyStateIcon} title={emptyStateTitle} description={emptyStateDescription} actionLabel={emptyStateActionLabel} onAction={onEmptyStateAction} />;
    }
    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.contentContainer, isEmpty && styles.emptyContentContainer, contentContainerStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} progressBackgroundColor={colors.card} />
          ) : undefined
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        {...flatListProps}
      />

      {showPageIndicator && totalPages > 1 && (
        <Animated.View
          style={StyleSheet.flatten([styles.pageIndicator, { backgroundColor: colors.card, borderColor: colors.border }, pageIndicatorAnimatedStyle, pageIndicatorStyle])}
          pointerEvents="none"
        >
          <ThemedText style={styles.pageIndicatorText}>
            Página {currentPage} de {totalPages}
          </ThemedText>
        </Animated.View>
      )}
    </ThemedView>
  );
}

// Convenience component for simple list items
interface PaginationItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PaginationItem({ children, style }: PaginationItemProps) {
  const { colors } = useTheme();

  return <ThemedView style={StyleSheet.flatten([styles.itemContainer, { borderBottomColor: colors.border }, style])}>{children}</ThemedView>;
}

const styles = {
  container: {
    flex: 1,
  } as ViewStyle,

  contentContainer: {
    flexGrow: 1,
  } as ViewStyle,

  emptyContentContainer: {
    flex: 1,
  } as ViewStyle,

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  } as ViewStyle,

  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    opacity: 0.7,
  } as TextStyle,

  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  } as ViewStyle,

  loadMoreButton: {
    paddingHorizontal: spacing.xl,
  } as ViewStyle,

  loadingMoreText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  } as TextStyle,

  pageIndicator: {
    position: "absolute",
    top: spacing.md,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  } as ViewStyle,

  pageIndicatorText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  } as TextStyle,

  itemContainer: {
    borderBottomWidth: 1,
  } as ViewStyle,
};

// Export helper hooks for common pagination patterns
export function usePaginationScroll(flatListRef: React.RefObject<FlatList>) {
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [flatListRef]);

  const scrollToItem = useCallback(
    (index: number, animated = true) => {
      flatListRef.current?.scrollToIndex({ index, animated });
    },
    [flatListRef],
  );

  return { scrollToTop, scrollToItem };
}
