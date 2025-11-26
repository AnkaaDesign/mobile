import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendar, IconAlertCircle, IconList, IconCalendarRepeat } from "@tabler/icons-react-native";
import type { Item, PpeDeliverySchedule } from "@/types";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { usePpeSchedulesInfiniteMobile } from "@/hooks";
import { SCHEDULE_FREQUENCY_LABELS, ASSIGNMENT_TYPE_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { differenceInDays } from "date-fns";
import { badgeColors } from "@/lib/theme/extended-colors";

interface SchedulesTableProps {
  item: Item;
  maxHeight?: number;
}

// Column definitions for PPE schedules
const createColumnDefinitions = () => [
  {
    key: "assignment",
    label: "Atribuição",
    width: 150,
  },
  {
    key: "frequency",
    label: "Frequência",
    width: 120,
  },
  {
    key: "status",
    label: "Status",
    width: 100,
  },
];

export function SchedulesTable({ item, maxHeight = 500 }: SchedulesTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns for PPE item detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["frequency", "status"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch schedules for this specific item with infinite scroll
  const {
    items: schedules,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = usePpeSchedulesInfiniteMobile({
    where: {
      itemId: item.id,
    },
    orderBy: { nextRun: "asc" },
    enabled: !!item.id,
  });

  // Filter schedules based on search (client-side for already loaded items)
  const filteredSchedules = useMemo(() => {
    if (!debouncedSearch) return schedules;

    const searchLower = debouncedSearch.toLowerCase();
    return schedules.filter((schedule: any) =>
      SCHEDULE_FREQUENCY_LABELS[schedule.frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS]?.toLowerCase().includes(searchLower) ||
      ASSIGNMENT_TYPE_LABELS[schedule.assignmentType as keyof typeof ASSIGNMENT_TYPE_LABELS]?.toLowerCase().includes(searchLower)
    );
  }, [schedules, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["frequency", "status"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleSchedulePress = (scheduleId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.schedules.details(scheduleId)) as any);
  };

  // Get status badge info
  const getStatusInfo = useCallback((schedule: PpeDeliverySchedule) => {
    if (!schedule.isActive) {
      return {
        text: "Inativo",
        color: badgeColors.muted.background,
        textColor: badgeColors.muted.text,
      };
    }

    if (!schedule.nextRun) {
      return {
        text: "Sem Próxima",
        color: badgeColors.warning.background,
        textColor: badgeColors.warning.text,
      };
    }

    const daysUntilNext = differenceInDays(new Date(schedule.nextRun), new Date());

    if (daysUntilNext < 0) {
      return {
        text: "Atrasado",
        color: badgeColors.error.background,
        textColor: badgeColors.error.text,
      };
    }

    if (daysUntilNext <= 7) {
      return {
        text: "Em Breve",
        color: badgeColors.warning.background,
        textColor: badgeColors.warning.text,
      };
    }

    return {
      text: "Ativo",
      color: badgeColors.success.background,
      textColor: badgeColors.success.text,
    };
  }, []);

  // Don't show if no schedules and not loading
  if (!isLoading && schedules.length === 0 && !searchQuery) {
    return null;
  }

  const showAssignment = visibleColumnKeys.includes("assignment");
  const showFrequency = visibleColumnKeys.includes("frequency");
  const showStatus = visibleColumnKeys.includes("status");

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconCalendar size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Agendamentos de Entrega {schedules.length > 0 && `(${schedules.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar agendamentos..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Schedules Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando agendamentos...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar agendamentos.
              </ThemedText>
            </View>
          ) : filteredSchedules.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhum agendamento encontrado para "${searchQuery}".`
                  : "Nenhum agendamento configurado para este EPI."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <FlatList
                data={filteredSchedules}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onEndReached={() => canLoadMore && loadMore()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
                renderItem={({ item: schedule, index }) => {
                  const isEven = index % 2 === 0;
                  const statusInfo = getStatusInfo(schedule);
                  const assignmentDisplay = ASSIGNMENT_TYPE_LABELS[schedule.assignmentType as keyof typeof ASSIGNMENT_TYPE_LABELS];

                  return (
                    <TouchableOpacity
                      style={[
                        styles.row,
                        {
                          backgroundColor: isEven ? colors.background : colors.card,
                        },
                      ]}
                      onPress={() => handleSchedulePress(schedule.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.rowContent}>
                        {/* Assignment Section */}
                        {showAssignment && (
                          <View style={styles.assignmentSection}>
                            <ThemedText style={styles.assignmentText} numberOfLines={1}>
                              {assignmentDisplay}
                            </ThemedText>
                          </View>
                        )}

                        {/* Frequency Section */}
                        {showFrequency && (
                          <View style={styles.frequencySection}>
                            <IconCalendarRepeat size={14} color={colors.mutedForeground} />
                            <View style={styles.frequencyInfo}>
                              <ThemedText style={styles.frequencyText}>
                                {SCHEDULE_FREQUENCY_LABELS[schedule.frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS]}
                                {schedule.frequencyCount > 1 && ` (${schedule.frequencyCount}x)`}
                              </ThemedText>
                              {schedule.nextRun && (
                                <ThemedText style={styles.nextRunText}>
                                  Próxima: {formatDate(schedule.nextRun)}
                                </ThemedText>
                              )}
                            </View>
                          </View>
                        )}

                        {/* Status Section */}
                        {showStatus && (
                          <View style={styles.statusSection}>
                            <Badge
                              variant="default"
                              style={StyleSheet.flatten([
                                styles.statusBadge,
                                { backgroundColor: statusInfo.color, borderWidth: 0 },
                              ])}
                            >
                              <ThemedText
                                style={{
                                  color: statusInfo.textColor,
                                  fontSize: fontSize.xs,
                                  fontWeight: fontWeight.medium,
                                }}
                              >
                                {statusInfo.text}
                              </ThemedText>
                            </Badge>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </View>
      </Card>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <ColumnVisibilitySlidePanel
          columns={allColumns}
          visibleColumns={new Set(visibleColumnKeys)}
          onVisibilityChange={handleColumnsChange}
          onClose={handleCloseColumns}
          defaultColumns={new Set(getDefaultVisibleColumns())}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    minHeight: 200,
    overflow: "hidden",
    marginHorizontal: -8,
  },
  row: {
    minHeight: 70,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  assignmentSection: {
    flex: 1,
  },
  assignmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  frequencySection: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  frequencyInfo: {
    flex: 1,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: "500",
  },
  nextRunText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  statusSection: {
    flex: 0.8,
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
