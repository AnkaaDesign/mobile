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
import { useBorrowsInfiniteMobile } from '../../../../hooks/use-borrows-infinite-mobile';
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import type { Borrow } from '../../../../types';

export default function MyBorrowsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Build query params - only show current user's borrows
  const queryParams = useMemo(() => ({
    where: {
      userId: user?.id,
    },
    include: {
      product: true,
    },
    orderBy: { createdAt: "desc" },
    ...(searchText ? { searchingFor: searchText } : {}),
  }), [user?.id, searchText]);

  // Fetch borrows with infinite scroll
  const {
    items: borrows,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    totalItemsLoaded,
    totalCount,
  } = useBorrowsInfiniteMobile(queryParams);

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

  const handleBorrowPress = (borrowId: string) => {
    router.push(`/pessoal/meus-emprestimos/detalhes/${borrowId}` as any);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case BORROW_STATUS.ACTIVE:
        return "default";
      case BORROW_STATUS.RETURNED:
        return "success";
      case BORROW_STATUS.OVERDUE:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const renderBorrowItem = ({ item }: { item: Borrow }) => {
    const productName = typeof item.product === 'string' ? item.product : (item.product as any)?.name || 'Produto';

    return (
      <TouchableOpacity
        style={[styles.borrowCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleBorrowPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <ThemedText style={styles.productText} numberOfLines={1}>
              {productName}
            </ThemedText>
            <ThemedText style={styles.quantityText}>
              Quantidade: {item.quantity}
            </ThemedText>
          </View>
          <Badge variant={getStatusBadgeVariant(item.status)}>
            {BORROW_STATUS_LABELS[item.status as keyof typeof BORROW_STATUS_LABELS]}
          </Badge>
        </View>

        <View style={styles.datesContainer}>
          <ThemedText style={styles.dateLabel}>Emprestado em: {formatDate(item.borrowedAt)}</ThemedText>
          {item.expectedReturnDate && (
            <ThemedText style={styles.dateLabel}>
              Devolução prevista: {formatDate(item.expectedReturnDate)}
            </ThemedText>
          )}
          {item.returnedAt && (
            <ThemedText style={styles.dateLabel}>
              Devolvido em: {formatDate(item.returnedAt)}
            </ThemedText>
          )}
        </View>

        {item.reason && (
          <ThemedText style={styles.reasonText} numberOfLines={2}>
            Motivo: {item.reason}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

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
      <ThemedText style={styles.emptyText}>Nenhum empréstimo encontrado</ThemedText>
    </View>
  );

  if (isLoading && borrows.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Meus Empréstimos</ThemedText>
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
          placeholder="Buscar empréstimos..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {/* List */}
      <FlatList
        data={borrows}
        renderItem={renderBorrowItem}
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
  borrowCard: {
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
  productText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  quantityText: {
    fontSize: 14,
    opacity: 0.7,
  },
  datesContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: 13,
    opacity: 0.8,
  },
  reasonText: {
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
