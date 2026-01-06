import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { Icon } from "@/components/ui/icon";
import type { CalculationRow } from "@/types/secullum";

const FIXED_COLUMN_WIDTH = 80;
const SCROLLABLE_COLUMN_WIDTH = 70;
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 36;

// Day abbreviations in Portuguese
const DAY_ABBREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface ColumnDefinition {
  key: string;
  label: string;
}

interface CalculationsTableProps {
  data: CalculationRow[];
  columns: ColumnDefinition[];
  visibleColumns: Set<string>;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Format date as "dd/mm Dia."
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";

  try {
    // Try to parse the date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If it's already formatted or invalid, return as is
      return dateStr;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfWeek = DAY_ABBREV[date.getDay()];

    return `${day}/${month} ${dayOfWeek}.`;
  } catch {
    return dateStr;
  }
};

export const CalculationsTable = React.memo<CalculationsTableProps>(({
  data,
  columns,
  visibleColumns,
  onRefresh,
  refreshing = false,
  loading = false,
}) => {
  const { colors, isDark } = useTheme();
  const scrollableListRef = useRef<FlatList>(null);

  // Get visible columns (excluding date which is fixed)
  const displayColumns = useMemo(() => {
    return columns.filter((col) => col.key !== "date" && visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  // Calculate total scrollable width
  const scrollableWidth = displayColumns.length * SCROLLABLE_COLUMN_WIDTH;

  // Sync scrollable list to fixed list scroll position
  const handleMasterScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollableListRef.current?.scrollToOffset({ offset: offsetY, animated: false });
  }, []);

  // Row background color
  const getRowBg = useCallback((index: number) => {
    const isEven = index % 2 === 0;
    return isEven ? colors.background : (isDark ? extendedColors.neutral[900] : extendedColors.neutral[50]);
  }, [colors, isDark]);

  // Render fixed column cell (date)
  const renderFixedCell = useCallback(({ item, index }: { item: CalculationRow; index: number }) => (
    <View style={[styles.fixedCell, { backgroundColor: getRowBg(index), borderBottomColor: colors.border }]}>
      <ThemedText style={styles.dateCellText} numberOfLines={1}>
        {formatDate(item.date)}
      </ThemedText>
    </View>
  ), [colors, getRowBg]);

  // Render scrollable row
  const renderScrollableRow = useCallback(({ item, index }: { item: CalculationRow; index: number }) => (
    <View style={[styles.scrollableRow, { backgroundColor: getRowBg(index), borderBottomColor: colors.border }]}>
      {displayColumns.map((column) => {
        const value = item[column.key as keyof CalculationRow];
        const isEmpty = !value || value === "0" || value === "00:00";

        return (
          <View key={column.key} style={[styles.cell, { width: SCROLLABLE_COLUMN_WIDTH }]}>
            <ThemedText
              style={[
                styles.cellText,
                isEmpty && { color: colors.mutedForeground, opacity: 0.4 }
              ]}
              numberOfLines={1}
            >
              {isEmpty ? "-" : value}
            </ThemedText>
          </View>
        );
      })}
    </View>
  ), [colors, displayColumns, getRowBg]);

  // Empty state
  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-x" size="xl" variant="muted" />
      <ThemedText style={styles.emptyTitle}>Nenhum registro encontrado</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Não há registros de ponto para o período selecionado
      </ThemedText>
    </View>
  ), [colors]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
      </View>
    );
  }

  // Empty state with pull-to-refresh
  if (data.length === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {renderEmpty()}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.tableWrapper}>
          {/* Fixed Column (Date) - This is the scroll master */}
          <View style={[styles.fixedColumn, { borderRightColor: colors.border }]}>
            {/* Fixed Header */}
            <View style={[
              styles.fixedHeader,
              {
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: colors.border,
              }
            ]}>
              <ThemedText style={[styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }]}>
                DATA
              </ThemedText>
            </View>

            {/* Fixed Column List - Master scroll */}
            <FlatList
              data={data}
              renderItem={renderFixedCell}
              keyExtractor={(item) => `fixed-${item.id}`}
              onScroll={handleMasterScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                ) : undefined
              }
              getItemLayout={(_, index) => ({
                length: ROW_HEIGHT,
                offset: ROW_HEIGHT * index,
                index,
              })}
            />
          </View>

          {/* Scrollable Columns */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            bounces={false}
            style={styles.horizontalScroll}
          >
            <View style={{ width: scrollableWidth }}>
              {/* Scrollable Header */}
              <View style={[
                styles.scrollableHeader,
                {
                  backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                  borderBottomColor: colors.border,
                }
              ]}>
                {displayColumns.map((column) => (
                  <View key={column.key} style={[styles.headerCell, { width: SCROLLABLE_COLUMN_WIDTH }]}>
                    <ThemedText
                      style={[styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }]}
                      numberOfLines={1}
                    >
                      {column.label.toUpperCase()}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Scrollable Rows List - Slave scroll (follows master) */}
              <FlatList
                ref={scrollableListRef}
                data={data}
                renderItem={renderScrollableRow}
                keyExtractor={(item) => `scroll-${item.id}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: ROW_HEIGHT,
                  offset: ROW_HEIGHT * index,
                  index,
                })}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  // Fixed column styles
  fixedColumn: {
    width: FIXED_COLUMN_WIDTH,
    borderRightWidth: 1,
  },
  fixedHeader: {
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  fixedCell: {
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateCellText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  // Scrollable columns styles
  horizontalScroll: {
    flex: 1,
  },
  scrollableHeader: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    height: HEADER_HEIGHT,
  },
  headerText: {
    fontSize: 8,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 10,
    textAlign: "center",
  },
  scrollableRow: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    height: ROW_HEIGHT,
  },
  cellText: {
    fontSize: 11,
    textAlign: "center",
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyScrollContent: {
    flex: 1,
    minHeight: 400, // Ensure enough height for pull-to-refresh
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});

CalculationsTable.displayName = "CalculationsTable";
