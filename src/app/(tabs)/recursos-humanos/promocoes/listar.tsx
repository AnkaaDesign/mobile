import { useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { router } from "expo-router";

import { ThemedView } from "@/components/ui/themed-view";
import { Header } from "@/components/ui/header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useNav } from "@/contexts/nav";
import { useUserPositionHistories } from "@/hooks/useUserPositionHistory";
import { UserPositionHistoryListItem } from "@/components/human-resources/user-position-history";
import type { UserPositionHistory } from "@/types";

export default function PromotionListScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      fallback="unauthorized"
    >
      <PromotionListScreenInner />
    </PrivilegeGate>
  );
}

function PromotionListScreenInner() {
  const nav = useNav();

  const { data, isLoading, error, refetch, isRefetching } = useUserPositionHistories({
    orderBy: { startedAt: "desc" },
    limit: 100,
    include: { user: true, position: true, previousPosition: true, changedBy: true },
  });

  useScreenReady(!isLoading);

  const records = data?.data ?? [];

  const handlePress = useCallback((history: UserPositionHistory) => {
    router.push(`/recursos-humanos/promocoes/detalhes/${history.id}`);
  }, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Promoções" subtitle="Histórico de cargos" showBackButton onBackPress={() => nav.goBack()} />
        <View style={styles.loading}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} style={styles.skeleton} />
          ))}
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar promoções"
        message="Não foi possível carregar o histórico de cargos. Tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header title="Promoções" subtitle="Histórico de cargos" showBackButton onBackPress={() => nav.goBack()} />
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserPositionHistoryListItem history={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            title="Nenhuma promoção"
            description="Nenhuma mudança de cargo foi registrada ainda."
            icon="user-up"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.md, gap: spacing.md },
  loading: { padding: spacing.md, gap: spacing.md },
  skeleton: { height: 110, borderRadius: 8 },
});
