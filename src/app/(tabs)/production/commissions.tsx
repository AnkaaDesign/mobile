import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useCommissionsInfiniteMobile } from "@/hooks/use-commissions-infinite-mobile";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { hasPrivilege, formatCurrency, formatDate } from '../../../utils';
import { showToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import type { Commission } from '../../../types';
import { Icon } from "@/components/ui/icon";

interface CommissionCardProps {
  commission: Commission;
  onPress: () => void;
}

const CommissionCard: React.FC<CommissionCardProps> = ({ commission, onPress }) => {
  const { colors } = useTheme();
  const isPaid = (commission as any).isPaid;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.commissionCard}>
        <View style={styles.commissionHeader}>
          <View style={styles.commissionInfo}>
            <ThemedText style={styles.commissionTitle} numberOfLines={1}>
              {(commission as any).user?.name || "Usuário não informado"}
            </ThemedText>
            <ThemedText style={styles.commissionSubtitle} numberOfLines={1}>
              {(commission as any).description || "Descrição não informada"}
            </ThemedText>
          </View>
          <View style={styles.commissionBadges}>
            <Badge variant={isPaid ? "success" : "warning"}>
              {isPaid ? "Pago" : "Pendente"}
            </Badge>
          </View>
        </View>

        <View style={styles.commissionDetails}>
          <View style={styles.commissionDetailRow}>
            <View style={styles.commissionDetailItem}>
              <Icon name="dollar-sign" size="sm" color={colors.mutedForeground} />
              <ThemedText style={styles.commissionDetailText}>
                {formatCurrency((commission as any).value || 0)}
              </ThemedText>
            </View>
            {(commission as any).percentage && (
              <View style={styles.commissionDetailItem}>
                <Icon name="percent" size="sm" color={colors.mutedForeground} />
                <ThemedText style={styles.commissionDetailText}>
                  {(commission as any).percentage}%
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.commissionFooter}>
          <View style={styles.commissionFooterItem}>
            <Icon name="calendar" size="sm" color={colors.mutedForeground} />
            <ThemedText style={styles.commissionFooterText}>
              {formatDate((commission as any).referenceDate || commission.createdAt)}
            </ThemedText>
          </View>
          {isPaid && (commission as any).paidAt && (
            <View style={styles.commissionFooterItem}>
              <Icon name="check-circle" size="sm" color="#10b981" />
              <ThemedText style={StyleSheet.flatten([styles.commissionFooterText, { color: "#10b981" }])}>
                Pago em {formatDate((commission as any).paidAt)}
              </ThemedText>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default function CommissionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaid, setFilterPaid] = useState<boolean | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check permissions
  const canViewAll = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) || hasPrivilege(user, SECTOR_PRIVILEGES.LEADER);
  const canView = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) || canViewAll;

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    const whereConditions: any[] = [];

    // If not admin/leader, only show user's own commissions
    if (!canViewAll) {
      whereConditions.push({ userId: user?.id });
    }

    // Paid filter
    if (filterPaid !== null) {
      whereConditions.push({ isPaid: filterPaid });
    }

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        OR: [
          { user: { name: { contains: debouncedSearch, mode: "insensitive" } } },
          { description: { contains: debouncedSearch, mode: "insensitive" } },
        ],
      });
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [filterPaid, debouncedSearch, canViewAll, user?.id]);

  // Fetch commissions
  const {
    items: commissions,
    loadMore: fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCommissionsInfiniteMobile({ ...queryParams, enabled: canView });

  // Calculate totals
  const totals = useMemo(() => {
    if (!commissions) return { total: 0, paid: 0, pending: 0 };
    return commissions.reduce((acc, commission) => {
      const value = (commission as any).value || 0;
      acc.total += value;
      if ((commission as any).isPaid) {
        acc.paid += value;
      } else {
        acc.pending += value;
      }
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [commissions]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Lista atualizada", type: "success" });
  };

  // Handle commission press
  const handleCommissionPress = (commissionId: string) => {
    router.push(`/personal/bonuses/details/${commissionId}` as any);
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="dollar-sign" size={64} color={colors.mutedForeground} />
      <ThemedText style={styles.emptyTitle}>Nenhuma comissão encontrada</ThemedText>
      <ThemedText style={styles.emptyMessage}>
        {searchQuery ? "Tente ajustar seus filtros de busca" : "Não há comissões registradas"}
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

  // Render header
  const renderHeader = () => (
    <View style={styles.summaryContainer}>
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Total</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {formatCurrency(totals.total)}
            </ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Pago</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: "#10b981" }])}>
              {formatCurrency(totals.paid)}
            </ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Pendente</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: "#f59e0b" }])}>
              {formatCurrency(totals.pending)}
            </ThemedText>
          </View>
        </View>
      </Card>
    </View>
  );

  if (!canView) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <View style={styles.centerContent}>
          <Icon name="lock" size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.errorTitle}>Acesso Negado</ThemedText>
          <ThemedText style={styles.errorMessage}>
            Você não tem permissão para visualizar comissões.
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
          <ThemedText style={styles.errorTitle}>Erro ao carregar comissões</ThemedText>
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
          placeholder="Buscar comissões..."
          style={styles.searchBar}
        />
        <View style={styles.headerActions}>
          <IconButton
            name={filterPaid === null ? "filter" : filterPaid ? "check-circle" : "clock"}
            variant="default"
            onPress={() => {
              // Cycle through: null -> false -> true -> null
              setFilterPaid(filterPaid === null ? false : filterPaid === false ? true : null);
            }}
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando comissões...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={commissions}
          renderItem={({ item }) => (
            <CommissionCard
              commission={item}
              onPress={() => handleCommissionPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
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
  summaryContainer: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  summaryCard: {
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  listContent: {
    padding: spacing.md,
  },
  commissionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  commissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  commissionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  commissionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  commissionSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  commissionBadges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  commissionDetails: {
    marginBottom: spacing.sm,
  },
  commissionDetailRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  commissionDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  commissionDetailText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  commissionFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    gap: spacing.xs,
  },
  commissionFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  commissionFooterText: {
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
    paddingVertical: spacing["3xl"],
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
});
