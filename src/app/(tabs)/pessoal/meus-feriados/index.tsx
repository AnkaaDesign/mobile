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
import { useHolidaysInfiniteMobile } from '../../../../hooks/use-holidays-infinite-mobile';
import { formatDate } from '../../../../utils';
import type { Holiday } from '../../../../types';

export default function MyHolidaysScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Build query params
  const queryParams = useMemo(() => ({
    orderBy: { date: "desc" },
    ...(searchText ? { searchingFor: searchText } : {}),
  }), [searchText]);

  // Fetch holidays with infinite scroll
  const {
    items: holidays,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    totalItemsLoaded,
    totalCount,
  } = useHolidaysInfiniteMobile(queryParams);

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

  const handleHolidayPress = (holidayId: string) => {
    router.push(`/pessoal/meus-feriados/detalhes/${holidayId}` as any);
  };

  const renderHolidayItem = ({ item }: { item: Holiday }) => (
    <TouchableOpacity
      style={[styles.holidayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleHolidayPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <ThemedText style={styles.nameText}>{item.name}</ThemedText>
          <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
        </View>
        {item.isNational && (
          <Badge variant="default">
            Nacional
          </Badge>
        )}
      </View>

      {item.description && (
        <ThemedText style={styles.descriptionText} numberOfLines={2}>
          {item.description}
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
      <ThemedText style={styles.emptyText}>Nenhum feriado encontrado</ThemedText>
    </View>
  );

  if (isLoading && holidays.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Feriados</ThemedText>
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
          placeholder="Buscar feriados..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {/* List */}
      <FlatList
        data={holidays}
        renderItem={renderHolidayItem}
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
  holidayCard: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  descriptionText: {
    fontSize: 14,
    opacity: 0.8,
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
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
