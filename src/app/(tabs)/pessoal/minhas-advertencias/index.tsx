import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing } from "@/constants/design-system";
import { useWarningsInfiniteMobile } from '../../../../hooks/use-warnings-infinite-mobile';
import { WARNING_TYPE, WARNING_TYPE_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import type { Warning } from '../../../../types';

export default function MyWarningsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Build query params - only show current user's warnings
  const queryParams = useMemo(() => ({
    where: {
      userId: user?.id,
    },
    orderBy: { date: "desc" },
    ...(searchText ? { searchingFor: searchText } : {}),
  }), [user?.id, searchText]);

  // Fetch warnings with infinite scroll
  const {
    items: warnings,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    totalItemsLoaded,
    totalCount,
  } = useWarningsInfiniteMobile(queryParams);

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

  const handleWarningPress = (warningId: string) => {
    router.push(`/pessoal/minhas-advertencias/detalhes/${warningId}` as any);
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case WARNING_TYPE.VERBAL:
        return "default";
      case WARNING_TYPE.WRITTEN:
        return "secondary";
      case WARNING_TYPE.SUSPENSION:
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderWarningItem = ({ item }: { item: Warning }) => (
    <TouchableOpacity
      style={[styles.warningCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleWarningPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <ThemedText style={styles.dateText}>
            {formatDate(item.date)}
          </ThemedText>
          <Badge variant={getTypeBadgeVariant(item.type)} style={styles.typeBadge}>
            {WARNING_TYPE_LABELS[item.type as keyof typeof WARNING_TYPE_LABELS]}
          </Badge>
        </View>
      </View>

      {item.reason && (
        <ThemedText style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </ThemedText>
      )}

      {item.givenBy && (
        <ThemedText style={styles.givenByText}>
          Aplicada por: {typeof item.givenBy === 'string' ? item.givenBy : (item.givenBy as any).name}
        </ThemedText>
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
      <ThemedText style={styles.emptyText}>Nenhuma advertência encontrada</ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
        Parabéns! Você não possui advertências registradas.
      </ThemedText>
    </View>
  );

  if (isLoading && warnings.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Minhas Advertências</ThemedText>
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
          placeholder="Buscar advertências..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {/* List */}
      <FlatList
        data={warnings}
        renderItem={renderWarningItem}
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
  warningCard: {
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  typeBadge: {
    marginLeft: spacing.xs,
  },
  reasonText: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  givenByText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: spacing.sm,
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
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
