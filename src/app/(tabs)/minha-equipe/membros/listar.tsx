import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useUsersInfiniteMobile } from "@/hooks";
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
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import {
  IconUser,
  IconPhone,
  IconMail,
  IconBriefcase,
  IconChevronRight,
  IconFilter,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { USER_STATUS } from "@/constants";
import { ListActionButton } from "@/components/ui/list-action-button";

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: "Experiência 1",
    [USER_STATUS.EXPERIENCE_PERIOD_2]: "Experiência 2",
    [USER_STATUS.CONTRACTED]: "Contratado",
    [USER_STATUS.DISMISSED]: "Demitido",
  };
  return statusLabels[status] || status;
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  const statusColors: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: colors.warning,
    [USER_STATUS.EXPERIENCE_PERIOD_2]: colors.warning,
    [USER_STATUS.CONTRACTED]: colors.success,
    [USER_STATUS.DISMISSED]: colors.destructive,
  };
  return statusColors[status] || colors.mutedForeground;
};

export default function TeamMembersListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");

  // Check if user is a team leader - must have managedSectorId
  const isTeamLeader = currentUser?.managedSectorId || false;

  // Build query parameters for team members
  const queryParams = useMemo(() => {
    const params: any = {
      where: {},
      include: {
        position: true,
        sector: true,
        ppeSize: true,
        _count: {
          select: {
            tasks: true,
            activities: true,
            borrows: true,
            vacations: true,
            warningsCollaborator: true,
          },
        },
      },
      orderBy: { name: "asc" },
    };

    // Filter by sector (team leader's sector)
    if (currentUser?.managedSectorId) {
      params.where.sectorId = currentUser.managedSectorId;
    } else if (currentUser?.sectorId) {
      params.where.sectorId = currentUser.sectorId;
    }

    // Exclude dismissed employees by default
    params.where.status = { not: USER_STATUS.DISMISSED };

    // Add search filter
    if (searchText) {
      params.searchingFor = searchText;
    }

    return params;
  }, [currentUser?.managedSectorId, currentUser?.sectorId, searchText]);

  const {
    users,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useUsersInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleMemberPress = (userId: string) => {
    router.push(`/(tabs)/minha-equipe/membros/detalhes/${userId}` as any);
  };

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
            <IconUsers size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.memberName, { color: colors.foreground, textAlign: "center", marginTop: spacing.md }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.memberPosition, { color: colors.mutedForeground, textAlign: "center" }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  const renderMemberItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleMemberPress(item.id)} activeOpacity={0.7}>
      <Card style={styles.memberCard}>
        <View style={styles.memberContent}>
          <View style={styles.memberLeft}>
            <Avatar
              source={item.avatar?.url ? { uri: item.avatar.url } : undefined}
              fallback={item.name?.[0]?.toUpperCase() || "U"}
              size={48}
            />
            <View style={styles.memberInfo}>
              <ThemedText style={[styles.memberName, { color: colors.foreground }]}>
                {item.name}
              </ThemedText>

              {item.position && (
                <View style={styles.infoRow}>
                  <IconBriefcase size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.memberPosition, { color: colors.mutedForeground }]}>
                    {item.position.name}
                  </ThemedText>
                </View>
              )}

              {item.email && (
                <View style={styles.infoRow}>
                  <IconMail size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.memberContact, { color: colors.mutedForeground }]}>
                    {item.email}
                  </ThemedText>
                </View>
              )}

              {item.phone && (
                <View style={styles.infoRow}>
                  <IconPhone size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.memberContact, { color: colors.mutedForeground }]}>
                    {item.phone}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          <View style={styles.memberRight}>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: getStatusColor(item.status, colors) + "20",
              }}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status, colors) },
                ]}
              >
                {getStatusLabel(item.status)}
              </ThemedText>
            </Badge>
            <IconChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </View>

        {/* Statistics */}
        {item._count && (
          <View style={[styles.statsContainer, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {item._count.tasks || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Tarefas
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {item._count.activities || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Atividades
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {item._count.borrows || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Empréstimos
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {item._count.vacations || 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Férias
              </ThemedText>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando membros da equipe...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar membros"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasMembers = Array.isArray(users) && users.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar membros..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {/* Team Info */}
      {currentUser?.sector && (
        <Card style={[styles.teamInfoCard, { backgroundColor: colors.primary + "10" }]}>
          <ThemedText style={[styles.teamInfoTitle, { color: colors.primary }]}>
            {currentUser.sector.name}
          </ThemedText>
          <ThemedText style={[styles.teamInfoSubtitle, { color: colors.primary }]}>
            {totalCount || 0} colaboradores
          </ThemedText>
        </Card>
      )}

      {hasMembers ? (
        <>
          <FlatList
            data={users}
            renderItem={renderMemberItem}
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
            icon={searchText ? "search" : "users"}
            title={searchText ? "Nenhum membro encontrado" : "Nenhum membro na equipe"}
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Não há colaboradores cadastrados neste setor"
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  teamInfoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamInfoTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  teamInfoSubtitle: {
    fontSize: fontSize.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  memberCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: "hidden",
  },
  memberContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  memberName: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  memberPosition: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  memberContact: {
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.xxs,
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