import React, { useState, useMemo } from "react";
import { View, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { FAB } from "@/components/ui/fab";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useCutsInfiniteMobile } from "@/hooks/use-cuts-infinite-mobile";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CUT_STATUS, CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from '../../../../constants';
import { hasPrivilege, formatDateTime } from '../../../../utils';
import { showToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import type { Cut } from '../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { Icon } from "@/components/ui/icon";

// Get badge variant for cut status
const getCutStatusBadgeVariant = (status: CUT_STATUS): "default" | "secondary" | "success" | "warning" | "destructive" => {
  switch (status) {
    case CUT_STATUS.COMPLETED:
      return "success";
    // Fixed: IN_PROGRESS and CANCELLED don't exist, using CUTTING instead
    case CUT_STATUS.CUTTING:
      return "default";
    case CUT_STATUS.PENDING:
      return "warning";
    default:
      return "secondary";
  }
};

interface CutCardProps {
  cut: Cut;
  onPress: () => void;
}

const CutCard: React.FC<CutCardProps> = ({ cut, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.cutCard}>
        <View style={styles.cutHeader}>
          <View style={styles.cutInfo}>
            <ThemedText style={styles.cutTitle} numberOfLines={1}>
              {(cut as any).file?.filename || "Arquivo de recorte"}
            </ThemedText>
            <ThemedText style={styles.cutSubtitle} numberOfLines={1}>
              {(cut as any).task?.name || "Tarefa não informada"}
            </ThemedText>
          </View>
          <Badge variant={getCutStatusBadgeVariant(cut.status as CUT_STATUS)}>
            {CUT_STATUS_LABELS[cut.status as keyof typeof CUT_STATUS_LABELS]}
          </Badge>
        </View>

        <View style={styles.cutDetails}>
          <View style={styles.cutDetailItem}>
            <Icon name="scissors" size="sm" color={colors.mutedForeground} />
            <ThemedText style={styles.cutDetailText}>
              {CUT_TYPE_LABELS[(cut as any).type as keyof typeof CUT_TYPE_LABELS]}
            </ThemedText>
          </View>
          <View style={styles.cutDetailItem}>
            <Icon name="map-pin" size="sm" color={colors.mutedForeground} />
            <ThemedText style={styles.cutDetailText}>
              {CUT_ORIGIN_LABELS[(cut as any).origin as keyof typeof CUT_ORIGIN_LABELS]}
            </ThemedText>
          </View>
        </View>

        {cut.createdAt && (
          <View style={styles.cutFooter}>
            <Icon name="clock" size="sm" color={colors.mutedForeground} />
            <ThemedText style={styles.cutFooterText}>
              Criado em {formatDateTime(cut.createdAt)}
            </ThemedText>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

export default function CuttingListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [_refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CUT_STATUS[]>([
    CUT_STATUS.PENDING,
    // Fixed: IN_PROGRESS doesn't exist, using CUTTING instead
    CUT_STATUS.CUTTING,
  ]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canView = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) || hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        file: true,
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    const whereConditions: any[] = [];

    // Status filter
    if (selectedStatus.length > 0) {
      whereConditions.push({ status: { in: selectedStatus } });
    }

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        OR: [
          { file: { filename: { contains: debouncedSearch, mode: "insensitive" } } },
          { task: { name: { contains: debouncedSearch, mode: "insensitive" } } },
        ],
      });
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [selectedStatus, debouncedSearch]);

  // Fetch cuts
  const {
    items: cuts,
    loadMore: fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCutsInfiniteMobile({ ...queryParams, enabled: canView });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Lista atualizada", type: "success" });
  };

  // Handle cut press
  const handleCutPress = (cutId: string) => {
    router.push(`/producao/recorte/detalhes/${cutId}` as any);
  };

  // Filter modal content
  const renderFilterModal = () => (
    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      title="Filtrar Cortes"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Status</ThemedText>
        <View style={styles.filterOptions}>
          {Object.values(CUT_STATUS).map((status) => (
            <FilterTag
              key={status}
              label={CUT_STATUS_LABELS[status as keyof typeof CUT_STATUS_LABELS]}
              selected={selectedStatus.includes(status)}
              onPress={() => {
                if (selectedStatus.includes(status)) {
                  setSelectedStatus(selectedStatus.filter((s) => s !== status));
                } else {
                  setSelectedStatus([...selectedStatus, status]);
                }
              }}
            />
          ))}
        </View>
      </View>
    </FilterModal>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="scissors" size={64} color={colors.mutedForeground} />
      <ThemedText style={styles.emptyTitle}>Nenhum corte encontrado</ThemedText>
      <ThemedText style={styles.emptyMessage}>
        {searchQuery ? "Tente ajustar seus filtros de busca" : "Não há cortes registrados"}
      </ThemedText>
    </View>
  );

  // Render footer
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.footerLoaderText}>Carregando mais...</ThemedText>
      </View>
    );
  };

  if (!canView) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <View style={styles.centerContent}>
          <Icon name="lock" size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.errorTitle}>Acesso Negado</ThemedText>
          <ThemedText style={styles.errorMessage}>
            Você não tem permissão para visualizar cortes.
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.destructive} />
          <ThemedText style={styles.errorTitle}>Erro ao carregar cortes</ThemedText>
          <ThemedText style={styles.errorMessage}>{(error as Error).message}</ThemedText>
          <IconButton
            name="refresh-cw"
            variant="default"
            onPress={() => refetch()}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* Header */}
      <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar cortes..."
          style={styles.searchBar}
        />
        <View style={styles.headerActions}>
          <IconButton
            name="filter"
            variant="default"
            onPress={() => setShowFilters(true)}
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando cortes...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={cuts}
          renderItem={({ item }) => (
            <CutCard
              cut={item}
              onPress={() => handleCutPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* FAB */}
      {canCreate && (
        <FAB
          icon="plus"
          onPress={() => router.push("/producao/recorte/cadastrar" as any)}
          style={styles.fab}
        />
      )}

      {/* Filter modal */}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBar: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
  },
  cutCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  cutInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cutTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  cutSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  cutDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cutDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cutDetailText: {
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  cutFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  cutFooterText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: fontSize.base,
    opacity: 0.6,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    fontSize: fontSize.base,
    opacity: 0.6,
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  footerLoaderText: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.xl,
  },
});
