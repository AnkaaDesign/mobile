import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing } from "@/constants/design-system";
import { useVacationsInfiniteMobile } from '../../../../hooks/use-vacations-infinite-mobile';
import { VACATION_STATUS, VACATION_STATUS_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import type { Vacation } from '../../../../types';

export default function MyVacationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Build query params - only show current user's vacations
  const queryParams = useMemo(() => ({
    where: {
      userId: user?.id,
    },
    orderBy: { startDate: "desc" },
    ...(searchText ? { searchingFor: searchText } : {}),
  }), [user?.id, searchText]);

  // Fetch vacations with infinite scroll
  const {
    items: vacations,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    totalItemsLoaded,
    totalCount,
  } = useVacationsInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleVacationPress = (vacationId: string) => {
    router.push(`/pessoal/minhas-ferias/detalhes/${vacationId}` as any);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case VACATION_STATUS.APPROVED:
        return "success";
      case VACATION_STATUS.PENDING:
        return "default";
      case VACATION_STATUS.REJECTED:
      case VACATION_STATUS.CANCELLED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const renderVacationItem = ({ item }: { item: Vacation }) => (
    <TouchableOpacity
      style={[styles.vacationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleVacationPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <ThemedText style={styles.dateText}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </ThemedText>
          <ThemedText style={styles.daysText}>
            {item.daysRequested} {item.daysRequested === 1 ? 'dia' : 'dias'}
          </ThemedText>
        </View>
        <Badge variant={getStatusBadgeVariant(item.status)}>
          {VACATION_STATUS_LABELS[item.status as keyof typeof VACATION_STATUS_LABELS]}
        </Badge>
      </View>

      {item.observation && (
        <ThemedText style={styles.observationText} numberOfLines={2}>
          {item.observation}
        </ThemedText>
      )}

      {item.isCollective && (
        <View style={[styles.collectiveBadge, { backgroundColor: colors.primary + "20" }]}>
          <ThemedText style={[styles.collectiveText, { color: colors.primary }]}>
            Férias Coletivas
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Carregando...</ThemedText>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>Nenhuma férias encontrada</ThemedText>
    </View>
  );

  if (isLoading && vacations.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Minhas Férias</ThemedText>
        {totalCount !== undefined && (
          <ThemedText style={styles.subtitle}>
            {totalItemsLoaded} de {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
          </ThemedText>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar férias..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {/* List */}
      <FlatList
        data={vacations}
        renderItem={renderVacationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={hasNextPage ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  vacationCard: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  daysText: {
    fontSize: 14,
    opacity: 0.7,
  },
  observationText: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  collectiveBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  collectiveText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
