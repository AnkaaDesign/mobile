import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { usePaintsInfiniteMobile } from "@/hooks/use-paints-infinite-mobile";
import { PAINT_FINISH_LABELS } from "@/constants";
import type { Paint } from "@/types";

const SWATCH_GAP = 8;
const SWATCH_PADDING = spacing.md;

interface PaintGroup {
  key: string;
  title: string;
  paints: Paint[];
}

/**
 * Build a normalized hex color string for use as backgroundColor.
 */
function normalizeHex(hex: string | null | undefined): string {
  if (!hex) return "#cccccc";
  const trimmed = hex.trim();
  if (trimmed.startsWith("#")) return trimmed;
  return `#${trimmed}`;
}

/**
 * Choose a contrasting text color (black or white) based on hex luminance.
 */
function getContrastColor(hex: string): string {
  const normalized = normalizeHex(hex).replace("#", "");
  if (normalized.length !== 6) return "#000000";
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  // Relative luminance approximation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

export default function ColorPaletteScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Use 3 columns on phones, more on wider screens
  const numColumns = screenWidth >= 768 ? 5 : 3;
  const swatchSize = useMemo(() => {
    const totalGaps = SWATCH_GAP * (numColumns - 1);
    const available = screenWidth - SWATCH_PADDING * 2 - totalGaps;
    return Math.floor(available / numColumns);
  }, [screenWidth, numColumns]);

  const queryParams = useMemo(
    () => ({
      // Lightweight projection - only what we need to render swatches
      select: {
        id: true,
        name: true,
        code: true,
        hex: true,
        finish: true,
        manufacturer: true,
        paintType: {
          select: { id: true, name: true },
        },
        paintBrand: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" as const },
    }),
    []
  );

  const {
    items: paints,
    isLoading,
    error,
    refresh,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = usePaintsInfiniteMobile(queryParams as any, 80);

  useScreenReady(!isLoading);

  // Group paints by paint type, then by finish within each type
  const groups: PaintGroup[] = useMemo(() => {
    const byType = new Map<string, Paint[]>();
    for (const paint of paints) {
      const typeName = paint.paintType?.name || "Sem tipo";
      const list = byType.get(typeName) ?? [];
      list.push(paint);
      byType.set(typeName, list);
    }

    const result: PaintGroup[] = [];
    Array.from(byType.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .forEach(([typeName, typePaints]) => {
        // Within each type, group by finish
        const byFinish = new Map<string, Paint[]>();
        for (const paint of typePaints) {
          const finishLabel =
            (paint.finish && PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS]) ||
            "Sem acabamento";
          const list = byFinish.get(finishLabel) ?? [];
          list.push(paint);
          byFinish.set(finishLabel, list);
        }

        Array.from(byFinish.entries())
          .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
          .forEach(([finishLabel, finishPaints]) => {
            result.push({
              key: `${typeName}__${finishLabel}`,
              title: `${typeName} • ${finishLabel}`,
              paints: finishPaints,
            });
          });
      });

    return result;
  }, [paints]);

  const handlePaintPress = (paint: Paint) => {
    router.push(`/(tabs)/pintura/catalogo/detalhes/${paint.id}` as any);
  };

  const handleEndReached = () => {
    if (canLoadMore && !isFetchingNextPage) {
      loadMore();
    }
  };

  // Initial loading state
  if (isLoading && paints.length === 0) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          style={{
            marginTop: spacing.md,
            fontSize: fontSize.sm,
            color: colors.mutedForeground,
          }}
        >
          Carregando paleta...
        </ThemedText>
      </View>
    );
  }

  if (error && paints.length === 0) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Icon name="alert-triangle" size="lg" color="#ef4444" />
        <ThemedText
          style={{
            marginTop: spacing.md,
            fontSize: fontSize.base,
            color: colors.foreground,
          }}
        >
          Erro ao carregar tintas
        </ThemedText>
        <ThemedText
          style={{
            marginTop: spacing.xs,
            fontSize: fontSize.sm,
            color: colors.mutedForeground,
            textAlign: "center",
            paddingHorizontal: spacing.lg,
          }}
        >
          Tente puxar para baixo para atualizar.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          // Trigger pagination when within 200px of bottom
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 200
          ) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText
            style={{
              fontSize: fontSize["2xl"],
              fontWeight: fontWeight.bold,
              color: colors.foreground,
            }}
          >
            Paleta de Cores
          </ThemedText>
          <ThemedText
            style={{
              fontSize: fontSize.sm,
              color: colors.mutedForeground,
              marginTop: spacing.xs,
            }}
          >
            {typeof totalCount === "number"
              ? `${totalCount} tintas catalogadas`
              : `${paints.length} tintas carregadas`}
          </ThemedText>
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="palette" size="xl" color={colors.mutedForeground} />
            <ThemedText
              style={{
                marginTop: spacing.md,
                fontSize: fontSize.base,
                color: colors.mutedForeground,
              }}
            >
              Nenhuma tinta encontrada.
            </ThemedText>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText
                  style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.foreground,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {group.title}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.mutedForeground,
                    marginLeft: spacing.sm,
                  }}
                >
                  {group.paints.length}
                </ThemedText>
              </View>

              <View style={[styles.swatchGrid, { gap: SWATCH_GAP }]}>
                {group.paints.map((paint) => {
                  const hex = normalizeHex(paint.hex);
                  const textColor = getContrastColor(hex);
                  return (
                    <Pressable
                      key={paint.id}
                      onPress={() => handlePaintPress(paint)}
                      style={({ pressed }) => [
                        styles.swatch,
                        {
                          width: swatchSize,
                          height: swatchSize,
                          backgroundColor: hex,
                          borderColor: isDark
                            ? "rgba(255, 255, 255, 0.12)"
                            : "rgba(0, 0, 0, 0.08)",
                          opacity: pressed ? 0.85 : 1,
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                        },
                      ]}
                    >
                      <View style={styles.swatchOverlay}>
                        <ThemedText
                          numberOfLines={2}
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: fontWeight.semibold,
                            color: textColor,
                          }}
                        >
                          {paint.name}
                        </ThemedText>
                        {paint.code ? (
                          <ThemedText
                            numberOfLines={1}
                            style={{
                              fontSize: 10,
                              color: textColor,
                              opacity: 0.85,
                              marginTop: 2,
                            }}
                          >
                            {paint.code}
                          </ThemedText>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: SWATCH_PADDING,
  },
  header: {
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  swatch: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  swatchOverlay: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});
