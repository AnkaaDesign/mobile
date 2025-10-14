import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, FAB, SearchBar, ErrorScreen, EmptyState, ItemsCountDisplay, Badge } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useExternalWithdrawalsInfiniteMobile } from "@/hooks";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconChevronRight } from "@tabler/icons-react-native";
import type { ExternalWithdrawal } from '../../../../types';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  PARTIALLY_RETURNED: "Parcialmente Devolvida",
  FULLY_RETURNED: "Devolvida",
  CHARGED: "Cobrada",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#3b82f6",
  PARTIALLY_RETURNED: "#f59e0b",
  FULLY_RETURNED: "#10b981",
  CHARGED: "#8b5cf6",
  CANCELLED: "#ef4444",
};

export default function ExternalWithdrawalListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");

  // Query parameters
  const queryParams = {
    ...(searchText.trim() && { searchingFor: searchText.trim() }),
    orderBy: { createdAt: "desc" as const },
    include: {
      items: true,
    },
  };

  // Fetch external withdrawals with infinite scroll
  const { items: withdrawals, isLoading, error, refetch, refresh, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded } = useExternalWithdrawalsInfiniteMobile(queryParams);

  // Handlers
  const handleWithdrawalPress = useCallback(
    (withdrawalId: string) => {
      router.push(routeToMobilePath(routes.inventory.externalWithdrawals.details(withdrawalId)) as any);
    },
    [router],
  );

  const handleCreateWithdrawal = useCallback(() => {
    router.push(routeToMobilePath(routes.inventory.externalWithdrawals.create) as any);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const renderWithdrawalCard = useCallback(
    ({ item: withdrawal }: { item: ExternalWithdrawal }) => {
      const statusColor = STATUS_COLORS[withdrawal.status] || "#6b7280";
      const statusLabel = STATUS_LABELS[withdrawal.status] || withdrawal.status;
      const itemCount = withdrawal.items?.length || 0;

      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}
          onPress={() => handleWithdrawalPress(withdrawal.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <ThemedText style={[styles.withdrawerName, { color: colors.foreground }]}>{withdrawal.withdrawerName}</ThemedText>
              <ThemedText style={[styles.cardDate, { color: isDark ? extendedColors.neutral[400] : extendedColors.neutral[600] }]}>
                {new Date(withdrawal.createdAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
            <IconChevronRight size={20} color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <ThemedText style={[styles.statusText, { color: "#ffffff" }]}>{statusLabel}</ThemedText>
              </View>
              <ThemedText style={[styles.cardInfo, { color: isDark ? extendedColors.neutral[400] : extendedColors.neutral[600] }]}>
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </ThemedText>
            </View>

            <View style={styles.cardRow}>
              <ThemedText style={[styles.returnLabel, { color: isDark ? extendedColors.neutral[400] : extendedColors.neutral[600] }]}>
                {withdrawal.willReturn ? "Com devolução" : "Sem devolução"}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, isDark, handleWithdrawalPress],
  );

  if (error) {
    return (
      <ErrorScreen error={error} message="Erro ao carregar retiradas" detail="Não foi possível carregar as retiradas externas. Tente novamente." onRetry={refetch} />
    );
  }

  return (
    <ErrorBoundary>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar retiradas..." style={styles.searchBar} />
        </View>

        {/* Withdrawals List */}
        {withdrawals.length > 0 ? (
          <FlatList
            data={withdrawals}
            renderItem={renderWithdrawalCard}
            keyExtractor={(withdrawal) => withdrawal.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
            onEndReached={canLoadMore ? loadMore : undefined}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Carregando retiradas...</ThemedText>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "package"}
              title={searchText ? "Nenhuma retirada encontrada" : "Nenhuma retirada cadastrada"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando sua primeira retirada externa"}
              actionLabel={searchText ? undefined : "Cadastrar Retirada"}
              onAction={searchText ? undefined : handleCreateWithdrawal}
            />
          </View>
        )}

        {/* Withdrawals count */}
        {withdrawals.length > 0 && (
          <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} itemType="retirada" itemTypePlural="retiradas" />
        )}

        {/* FAB */}
        <FAB icon="plus" onPress={handleCreateWithdrawal} />
      </ThemedView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    // SearchBar styles handled by component
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  withdrawerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: fontSize.xs,
  },
  cardBody: {
    gap: spacing.xs,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardInfo: {
    fontSize: fontSize.sm,
  },
  returnLabel: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
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
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
});
