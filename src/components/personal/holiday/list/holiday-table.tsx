import React, { useCallback, useMemo } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon} from "@/components/ui/icon";
import type { Holiday } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils";
import { HOLIDAY_TYPE_LABELS } from '@/constants/enum-labels';
import { HOLIDAY_TYPE } from '@/constants/enums';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (holiday: Holiday) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface HolidayTableProps {
  holidays: Holiday[];
  onHolidayPress?: (holidayId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper function to calculate days until holiday
const getDaysUntil = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);

  const diffTime = holidayDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Passado";
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays < 7) return `Em ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Em 1 semana" : `Em ${weeks} semanas`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Em 1 mês" : `Em ${months} meses`;
};

// Helper function to check if date is past
const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);
  return holidayDate < today;
};

// Helper function to get day of week
const getDayOfWeek = (date: Date): string => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date(date).getDay()];
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "name",
    header: "Feriado",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (holiday: Holiday) => (
      <View style={styles.nameContainer}>
        <ThemedText style={styles.nameText} numberOfLines={2}>
          {holiday.name}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "date",
    header: "Data",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (holiday: Holiday) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {formatDate(new Date(holiday.date))}
      </ThemedText>
    ),
  },
  {
    key: "dayOfWeek",
    header: "Dia da Semana",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (holiday: Holiday) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {getDayOfWeek(holiday.date)}
      </ThemedText>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (holiday: Holiday) => {
      if (!holiday.type) {
        return (
          <ThemedText style={styles.mutedText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }

      const getTypeColor = (type: HOLIDAY_TYPE) => {
        switch (type) {
          case HOLIDAY_TYPE.NATIONAL:
            return { bg: badgeColors.info.background, text: badgeColors.info.text };
          case HOLIDAY_TYPE.STATE:
            return { bg: badgeColors.success.background, text: badgeColors.success.text };
          case HOLIDAY_TYPE.MUNICIPAL:
            return { bg: badgeColors.warning.background, text: badgeColors.warning.text };
          case HOLIDAY_TYPE.OPTIONAL:
            return { bg: badgeColors.muted.background, text: badgeColors.muted.text };
          default:
            return { bg: badgeColors.muted.background, text: badgeColors.muted.text };
        }
      };

      const colors = getTypeColor(holiday.type);

      return (
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor: colors.bg,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: colors.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {HOLIDAY_TYPE_LABELS[holiday.type]}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (holiday: Holiday) => {
      const daysUntil = getDaysUntil(holiday.date);
      const isPast = isPastDate(holiday.date);

      const getStatusStyle = () => {
        if (isPast) return { color: extendedColors.neutral[400] };
        if (daysUntil === "Hoje") return { color: extendedColors.red[600], fontWeight: fontWeight.semibold as any };
        if (daysUntil === "Amanhã") return { fontWeight: fontWeight.semibold as any };
        return {};
      };

      return (
        <ThemedText style={[styles.cellText, getStatusStyle()]} numberOfLines={1}>
          {daysUntil}
        </ThemedText>
      );
    },
  },
  {
    key: "createdAt",
    header: "Cadastrado Em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (holiday: Holiday) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {holiday.createdAt ? formatDate(new Date(holiday.createdAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "Atualizado Em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (holiday: Holiday) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {holiday.updatedAt ? formatDate(new Date(holiday.updatedAt)) : "-"}
      </ThemedText>
    ),
  },
];

export const HolidayTable = React.memo<HolidayTableProps>(
  ({
    holidays,
    onHolidayPress,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["name", "date", "dayOfWeek", "type", "status"],
  }) => {
    const { colors, isDark } = useTheme();
    const prefetchTriggeredRef = React.useRef(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 3.0,
        date: 1.5,
        dayOfWeek: 2.0,
        type: 1.5,
        status: 1.5,
        createdAt: 1.8,
        updatedAt: 1.8,
      };

      // Filter visible columns
      const visible = allColumns.filter((col) => visibleColumnKeys.includes(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Assign proportional widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumnKeys]);

    // Calculate total table width
    const totalTableWidth = useMemo(() => {
      return displayColumns.reduce((sum, col) => sum + col.width, 0);
    }, [displayColumns]);

    // Handle sort toggle
    const handleHeaderPress = useCallback(
      (columnKey: string) => {
        const column = displayColumns.find((col) => col.key === columnKey);
        if (!column?.sortable || !onSort) return;

        const existingConfig = sortConfigs.find((config) => config.columnKey === columnKey);

        if (!existingConfig) {
          // Add new sort config (ascending)
          onSort([{ columnKey, direction: "asc", order: 0 }]);
        } else if (existingConfig.direction === "asc") {
          // Toggle to descending
          onSort([{ columnKey, direction: "desc", order: 0 }]);
        } else {
          // Remove sort
          onSort([]);
        }
      },
      [displayColumns, sortConfigs, onSort]
    );

    // Render sort indicator
    const renderSortIndicator = useCallback(
      (columnKey: string) => {
        const config = sortConfigs.find((c) => c.columnKey === columnKey);
        if (!config) return null;

        return (
          <Icon
            name={config.direction === "asc" ? "ChevronUp" : "ChevronDown"}
            size={14}
            color={colors.primary}
          />
        );
      },
      [sortConfigs, colors.primary]
    );

    // Render table header
    const renderHeader = useCallback(() => {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={totalTableWidth > availableWidth}
          style={[styles.headerScrollView, { backgroundColor: colors.muted }]}
        >
          <View style={[styles.headerRow, { width: totalTableWidth, borderBottomColor: colors.border }]}>
            {displayColumns.map((column) => (
              <Pressable
                key={column.key}
                style={[
                  styles.headerCell,
                  { width: column.width },
                  column.align === "center" && styles.centerAlign,
                  column.align === "right" && styles.rightAlign,
                ]}
                onPress={() => column.sortable && handleHeaderPress(column.key)}
                disabled={!column.sortable}
              >
                <View style={styles.headerContent}>
                  <ThemedText style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                    {column.header}
                  </ThemedText>
                  {column.sortable && renderSortIndicator(column.key)}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      );
    }, [displayColumns, totalTableWidth, colors, handleHeaderPress, renderSortIndicator]);

    // Render row
    const renderRow = useCallback(
      ({ item, index }: { item: Holiday; index: number }) => {
        const isEven = index % 2 === 0;

        return (
          <Pressable
            onPress={() => onHolidayPress?.(item.id)}
            style={({ pressed }) => [
              styles.rowPressable,
              {
                backgroundColor: pressed
                  ? colors.muted + "40"
                  : isEven
                  ? colors.background
                  : colors.muted + "20",
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={totalTableWidth > availableWidth}
            >
              <View style={[styles.row, { width: totalTableWidth, borderBottomColor: colors.border }]}>
                {displayColumns.map((column) => (
                  <View
                    key={column.key}
                    style={[
                      styles.cell,
                      { width: column.width },
                      column.align === "center" && styles.centerAlign,
                      column.align === "right" && styles.rightAlign,
                    ]}
                  >
                    {column.accessor(item)}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        );
      },
      [displayColumns, totalTableWidth, colors, onHolidayPress]
    );

    // Handle scroll and prefetching
    const handleScroll = useCallback(
      (event: any) => {
        if (!onPrefetch || prefetchTriggeredRef.current) return;

        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const scrollPosition = contentOffset.y + layoutMeasurement.height;
        const scrollThreshold = contentSize.height * 0.7;

        if (scrollPosition >= scrollThreshold) {
          prefetchTriggeredRef.current = true;
          onPrefetch();
        }
      },
      [onPrefetch]
    );

    // Reset prefetch trigger when data changes
    React.useEffect(() => {
      prefetchTriggeredRef.current = false;
    }, [holidays.length]);

    // Render footer
    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }, [loadingMore, colors.primary]);

    // Render empty state
    const renderEmpty = useCallback(() => {
      if (loading) return null;
      return (
        <View style={styles.emptyContainer}>
          <Icon name="Calendar" size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum feriado encontrado</ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            Não há feriados cadastrados no momento.
          </ThemedText>
        </View>
      );
    }, [loading, colors]);

    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          data={holidays}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          maxToRenderPerBatch={15}
          windowSize={11}
          removeClippedSubviews={true}
          initialNumToRender={20}
        />
      </View>
    );
  }
);

HolidayTable.displayName = "HolidayTable";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerScrollView: {
    flexGrow: 0,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    paddingVertical: spacing.sm,
  },
  headerCell: {
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  rowPressable: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  cell: {
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nameText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  mutedText: {
    fontSize: fontSize.sm,
    opacity: 0.5,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
