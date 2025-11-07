import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { useActivitiesInfiniteMobile } from "@/hooks";
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
  IconClock,
  IconUser,
  IconClipboard,
  IconCalendar,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDateTime, formatDuration } from "@/utils";

export default function TeamActivitiesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");

  // Check if user is a team leader
  const isTeamLeader = currentUser?.managedSectorId || false;

  // Build query parameters for team activities
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
        order: true,
        orderItem: true,
      },
      orderBy: { createdAt: "desc" },
    };

    if (searchText) {
      params.searchingFor = searchText;
    }

    return params;
  }, [isTeamLeader, currentUser?.managedSectorId, searchText]);

  const {
    items: activities,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useActivitiesInfiniteMobile(queryParams || {}, {
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
            <IconClock size={48} color={colors.mutedForeground} />
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

  const renderActivityItem = ({ item }: { item: any }) => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
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
        <Badge variant="secondary">
          <ThemedText style={[styles.badgeText, { color: colors.mutedForeground }]}>
            {item.type || "ATIVIDADE"}
          </ThemedText>
        </Badge>
      </View>

      <View style={styles.activityContent}>
        {item.description && (
          <View style={styles.descriptionRow}>
            <IconClipboard size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.description, { color: colors.foreground }]}>
              {item.description}
            </ThemedText>
          </View>
        )}

        {item.item && (
          <View style={styles.itemRow}>
            <ThemedText style={[styles.itemLabel, { color: colors.mutedForeground }]}>
              Item:
            </ThemedText>
            <ThemedText style={[styles.itemValue, { color: colors.foreground }]}>
              {item.item.name}
            </ThemedText>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <IconCalendar size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatDateTime(item.createdAt)}
            </ThemedText>
          </View>
          {item.duration && (
            <View style={styles.metaItem}>
              <IconClock size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatDuration(item.duration)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  if (isLoading && activities.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando atividades da equipe...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && activities.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar atividades"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasActivities = Array.isArray(activities) && activities.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Atividades da Equipe
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
          placeholder="Buscar atividades..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {hasActivities ? (
        <>
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
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
            icon={searchText ? "search" : "clock"}
            title={searchText ? "Nenhuma atividade encontrada" : "Sem atividades"}
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Não há atividades registradas para a equipe"
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
  activityCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  activityHeader: {
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
  },
  activityContent: {
    gap: spacing.xs,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  itemLabel: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  itemValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
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