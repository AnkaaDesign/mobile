import { useCallback } from "react";
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Holiday } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { HOLIDAY_TYPE, HOLIDAY_TYPE_LABELS } from '../../../../constants';
import { format, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HolidayTableProps {
  holidays: Holiday[];
  onHolidayPress?: (holidayId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
}

export function HolidayTable({
  holidays,
  onHolidayPress,
  onRefresh,
  onEndReached,
  refreshing,
  loading,
  loadingMore,
}: HolidayTableProps) {
  const { colors } = useTheme();

  const getTypeColor = (type: HOLIDAY_TYPE | null) => {
    switch (type) {
      case HOLIDAY_TYPE.NATIONAL:
        return "default";
      case HOLIDAY_TYPE.STATE:
        return "secondary";
      case HOLIDAY_TYPE.MUNICIPAL:
        return "outline";
      case HOLIDAY_TYPE.OPTIONAL:
        return "muted";
      default:
        return "outline";
    }
  };

  const formatHolidayDate = (date: Date) => {
    const holidayDate = new Date(date);
    const currentYear = new Date().getFullYear();

    if (isSameYear(holidayDate, new Date(currentYear, 0, 1))) {
      return format(holidayDate, "dd 'de' MMMM", { locale: ptBR });
    }
    return format(holidayDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const renderHolidayItem = useCallback(
    ({ item }: { item: Holiday }) => {
      const handlePress = () => {
        if (onHolidayPress) {
          onHolidayPress(item.id);
        }
      };

      return (
        <TouchableOpacity
          onPress={handlePress}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            {/* Header: Name */}
            <ThemedText style={styles.holidayName} numberOfLines={2}>
              {item.name}
            </ThemedText>

            {/* Date */}
            <View style={styles.row}>
              <Icon name="calendar" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.dateText, { color: colors.mutedForeground }]}>
                {formatHolidayDate(item.date)}
              </ThemedText>
            </View>

            {/* Type Badge */}
            {item.type && (
              <View style={styles.badgeRow}>
                <Badge variant={getTypeColor(item.type)} size="sm">
                  {HOLIDAY_TYPE_LABELS[item.type]}
                </Badge>
              </View>
            )}
          </View>

          {/* Chevron */}
          <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      );
    },
    [colors, onHolidayPress],
  );

  const renderEmptyComponent = useCallback(() => {
    if (loading) return null;

    return (
      <ThemedView style={styles.emptyContainer}>
        <Icon name="calendar-off" size={48} color={colors.mutedForeground} />
        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Nenhum feriado encontrado
        </ThemedText>
      </ThemedView>
    );
  }, [loading, colors]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loadingMore, colors]);

  const keyExtractor = useCallback((item: Holiday) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && onEndReached) {
      onEndReached();
    }
  }, [loadingMore, onEndReached]);

  return (
    <FlatList
      data={holidays}
      renderItem={renderHolidayItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooter}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  holidayName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 3,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});
