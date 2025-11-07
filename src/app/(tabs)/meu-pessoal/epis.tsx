import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { usePpeDeliveriesInfiniteMobile } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import {
  IconShieldCheck,
  IconUser,
  IconCalendar,
  IconPackage,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/utils";

export default function TeamEPIsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");

  // Check if user is a team leader
  const isTeamLeader = currentUser?.managedSectorId || false;

  // Build query parameters for team PPE deliveries
  const queryParams = useMemo(() => {
    if (!isTeamLeader || !currentUser?.managedSectorId) return null;

    const params: any = {
      where: {
        user: {
          sectorId: currentUser.managedSectorId,
        },
      },
      include: {
        user: {
          include: {
            position: true,
          },
        },
        item: true,
        approvedBy: true,
      },
      orderBy: { createdAt: "desc" },
    };

    if (searchText) {
      params.searchingFor = searchText;
    }

    return params;
  }, [isTeamLeader, currentUser?.managedSectorId, searchText]);

  const {
    items: deliveries,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = usePpeDeliveriesInfiniteMobile(queryParams || {}, {
    enabled: !!queryParams,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  // Show access denied if not a team leader
  if (!isTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.loadingCard}>
            <IconShieldCheck size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground, textAlign: "center", marginTop: spacing.md }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground, textAlign: "center" }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return colors.warning;
      case "APPROVED":
        return colors.success;
      case "REJECTED":
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendente";
      case "APPROVED":
        return "Aprovado";
      case "REJECTED":
        return "Rejeitado";
      default:
        return status;
    }
  };

  const renderDeliveryItem = ({ item }: { item: any }) => (
    <Card style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <View style={styles.userInfo}>
          <Avatar
            source={item.user?.avatar?.url ? { uri: item.user.avatar.url } : undefined}
            fallback={item.user?.name?.[0]?.toUpperCase() || "U"}
            size={40}
          />
          <View style={styles.userDetails}>
            <ThemedText style={[styles.userName, { color: colors.foreground }]}>
              {item.user?.name || "Usuário"}
            </ThemedText>
            {item.user?.position && (
              <ThemedText style={[styles.userPosition, { color: colors.mutedForeground }]}>
                {item.user.position.name}
              </ThemedText>
            )}
          </View>
        </View>
        <Badge
          variant="secondary"
          style={{ backgroundColor: getStatusColor(item.status) + "20" }}
        >
          <ThemedText style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </ThemedText>
        </Badge>
      </View>

      <View style={styles.deliveryContent}>
        <View style={styles.itemInfo}>
          <IconPackage size={16} color={colors.mutedForeground} />
          <View style={styles.itemDetails}>
            <ThemedText style={[styles.itemName, { color: colors.foreground }]}>
              {item.item?.name || "EPI"}
            </ThemedText>
            <ThemedText style={[styles.itemQuantity, { color: colors.mutedForeground }]}>
              Quantidade: {item.quantity || 1}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <IconCalendar size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatDate(item.deliveryDate || item.createdAt)}
            </ThemedText>
          </View>
          {item.nextDeliveryDate && (
            <View style={styles.metaItem}>
              <ThemedText style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                Próxima:
              </ThemedText>
              <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatDate(item.nextDeliveryDate)}
              </ThemedText>
            </View>
          )}
        </View>

        {item.approvedBy && (
          <View style={styles.approvalRow}>
            <ThemedText style={[styles.approvalText, { color: colors.mutedForeground }]}>
              Aprovado por: {item.approvedBy.name}
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );

  if (isLoading && deliveries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando EPIs da equipe...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && deliveries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar EPIs"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasDeliveries = Array.isArray(deliveries) && deliveries.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          EPIs da Equipe
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {currentUser?.sector?.name || "Setor"}
        </ThemedText>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar EPIs..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {hasDeliveries ? (
        <>
          <FlatList
            data={deliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isRefetching}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            onEndReached={canLoadMore ? loadMore : undefined}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loadingMore}>
                  <ThemedText style={{ color: colors.mutedForeground }}>
                    Carregando mais...
                  </ThemedText>
                </View>
              ) : null
            }
          />
          <ItemsCountDisplay
            loadedCount={totalItemsLoaded}
            totalCount={totalCount}
            isLoading={isFetchingNextPage}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "shield"}
            title={searchText ? "Nenhum EPI encontrado" : "Sem entregas de EPIs"}
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Não há entregas de EPIs registradas para a equipe"
            }
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  deliveryCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  userPosition: {
    fontSize: fontSize.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  deliveryContent: {
    gap: spacing.sm,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  itemQuantity: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: fontSize.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  approvalRow: {
    marginTop: spacing.xs,
  },
  approvalText: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});