import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconCalendarCheck, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { User } from "@/types";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useVacationsInfiniteMobile } from "@/hooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VACATION_STATUS } from "@/constants";

interface VacationsTableProps {
  employee: User;
  maxHeight?: number;
}

// Column definitions for vacations table
const createColumnDefinitions = () => {
  return [
    {
      key: "startAt",
      label: "Início",
      sortable: true,
    },
    {
      key: "endAt",
      label: "Fim",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
    },
  ];
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  switch (status) {
    case VACATION_STATUS.APPROVED:
    case VACATION_STATUS.ACTIVE:
      return colors.success;
    case VACATION_STATUS.PENDING:
      return colors.warning;
    case VACATION_STATUS.REJECTED:
    case VACATION_STATUS.CANCELLED:
      return colors.destructive;
    case VACATION_STATUS.COMPLETED:
      return colors.mutedForeground;
    default:
      return colors.mutedForeground;
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [VACATION_STATUS.PENDING]: "Pendente",
    [VACATION_STATUS.APPROVED]: "Aprovado",
    [VACATION_STATUS.REJECTED]: "Rejeitado",
    [VACATION_STATUS.ACTIVE]: "Ativo",
    [VACATION_STATUS.COMPLETED]: "Concluído",
    [VACATION_STATUS.CANCELLED]: "Cancelado",
  };
  return statusLabels[status] || status;
};

export function VacationsTable({ employee, maxHeight = 500 }: VacationsTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns: startAt, endAt
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["startAt", "endAt"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch vacations for this specific employee
  const {
    items: vacations,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useVacationsInfiniteMobile({
    where: {
      userId: employee.id,
    },
    orderBy: { startAt: "desc" },
    enabled: true,
  });

  // Filter vacations by search query
  const filteredVacations = useMemo(() => {
    if (!debouncedSearch) return vacations;

    const searchLower = debouncedSearch.toLowerCase();
    return vacations.filter((vacation) => {
      const statusLabel = getStatusLabel(vacation.status).toLowerCase();
      const startDate = format(new Date(vacation.startAt), "dd/MM/yyyy", { locale: ptBR });
      const endDate = format(new Date(vacation.endAt), "dd/MM/yyyy", { locale: ptBR });

      return (
        statusLabel.includes(searchLower) ||
        startDate.includes(searchLower) ||
        endDate.includes(searchLower)
      );
    });
  }, [vacations, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["startAt", "endAt"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Render vacation row
  const renderVacationRow = useCallback(({ item: vacation, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    const backgroundColor = isEven ? colors.background : colors.card;

    return (
      <View style={[styles.row, { backgroundColor }]}>
        {visibleColumnKeys.includes("startAt") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {format(new Date(vacation.startAt), "dd/MM/yyyy", { locale: ptBR })}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("endAt") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {format(new Date(vacation.endAt), "dd/MM/yyyy", { locale: ptBR })}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("status") && (
          <View style={styles.cell}>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: getStatusColor(vacation.status, colors) + "20",
              }}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(vacation.status, colors) },
                ]}
              >
                {getStatusLabel(vacation.status)}
              </ThemedText>
            </Badge>
          </View>
        )}
      </View>
    );
  }, [colors, visibleColumnKeys]);

  // Don't show if no vacations and not loading
  if (!isLoading && filteredVacations.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconCalendarCheck size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Férias {vacations.length > 0 && `(${vacations.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar férias..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Vacation Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando férias...</ThemedText>
            </View>
          ) : error ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Erro ao carregar férias.
              </ThemedText>
            </View>
          ) : filteredVacations.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {searchQuery
                  ? `Nenhuma férias encontrada para "${searchQuery}".`
                  : "Nenhuma férias registrada."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <FlatList
                data={filteredVacations}
                renderItem={renderVacationRow}
                keyExtractor={(item) => item.id}
                onEndReached={() => canLoadMore && loadMore()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
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
    overflow: "hidden",
    marginHorizontal: -8,
    minHeight: 200,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cell: {
    flex: 1,
    justifyContent: "center",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
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
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
