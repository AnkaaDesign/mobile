import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize } from "@/constants/design-system";
import { IconAlertCircle, IconList, IconCut } from "@tabler/icons-react-native";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useCutsInfiniteMobile } from "@/hooks";
import { CutsTable as CutsTableComponent, createColumnDefinitions } from "@/components/production/cuts/list/cuts-table";
import { CutRequestModal } from "@/components/production/cuts/form/cut-request-modal";
import { canRequestCutForTask } from "@/utils/permissions/entity-permissions";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import type { Cut } from "@/types";

interface CutsTableProps {
  taskId: string;
  taskSectorId?: string | null;
  maxHeight?: number;
}

export function CutsTable({ taskId, taskSectorId, maxHeight = 400 }: CutsTableProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if user can request cuts for this task
  const canRequestCuts = canRequestCutForTask(user, taskSectorId);

  // Cut request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedCutForRequest, setSelectedCutForRequest] = useState<Cut | null>(null);

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Use only filename and status columns for task detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["filename", "status"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch cuts for this specific task with infinite scroll
  const {
    items: cuts,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useCutsInfiniteMobile({
    where: {
      taskId,
    },
    include: {
      file: true,
    },
    orderBy: { createdAt: "desc" },
    enabled: !!taskId,
  }) as { items: Cut[]; isLoading: boolean; error: Error | null; loadMore: () => void; canLoadMore: boolean; isFetchingNextPage: boolean; totalCount: number };

  // Filter cuts based on search (client-side for already loaded cuts)
  const filteredCuts = useMemo(() => {
    if (!debouncedSearch) return cuts;

    const lowerSearch = debouncedSearch.toLowerCase();
    return cuts.filter((cut: any) => {
      const filename = cut.file?.filename?.toLowerCase() || "";
      return filename.includes(lowerSearch);
    });
  }, [cuts, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
  }, []);

  // Get default visible columns (for the task detail view)
  const getDefaultVisibleColumns = useCallback(() => {
    return ["filename", "status"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleCutPress = (cutId: string) => {
    // Navigate to cut details if needed
    // For now, we don't have a cut details page
  };

  // Handle cut request - open modal with selected cut
  const handleCutRequest = useCallback((cutId: string) => {
    const cut = cuts.find((c: Cut) => c.id === cutId);
    if (cut) {
      setSelectedCutForRequest(cut as Cut);
      setIsRequestModalOpen(true);
    }
  }, [cuts]);

  // Handle request modal close
  const handleRequestModalClose = useCallback(() => {
    setIsRequestModalOpen(false);
    setSelectedCutForRequest(null);
  }, []);

  // Don't show if no cuts and not loading
  if (!isLoading && cuts.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconCut size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Recortes {cuts.length > 0 && `(${cuts.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar recortes..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Cuts Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando recortes...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar recortes.
              </ThemedText>
            </View>
          ) : filteredCuts.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhum recorte encontrado para "${searchQuery}".`
                  : "Nenhum recorte associado a esta tarefa."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <CutsTableComponent
                cuts={filteredCuts}
                onCutPress={handleCutPress}
                enableSwipeActions={canRequestCuts}
                onCutRequest={canRequestCuts ? handleCutRequest : undefined}
                visibleColumnKeys={visibleColumnKeys}
                onEndReached={() => canLoadMore && loadMore()}
                loadingMore={isFetchingNextPage}
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

      {/* Cut Request Modal */}
      <CutRequestModal
        visible={isRequestModalOpen}
        onClose={handleRequestModalClose}
        cutItem={selectedCutForRequest}
        onSuccess={() => {
          // Refetch cuts after successful request
          handleRequestModalClose();
        }}
      />
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
});
