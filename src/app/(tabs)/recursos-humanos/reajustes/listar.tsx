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
import { useSalaryAdjustments } from "@/hooks/useSalaryAdjustment";
import { SalaryAdjustmentListItem } from "@/components/human-resources/salary-adjustment";
import type { SalaryAdjustment } from "@/types";

export default function SalaryAdjustmentListScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      fallback="unauthorized"
    >
      <SalaryAdjustmentListScreenInner />
    </PrivilegeGate>
  );
}

function SalaryAdjustmentListScreenInner() {
  const nav = useNav();

  const { data, isLoading, error, refetch, isRefetching } = useSalaryAdjustments({
    orderBy: { effectiveDate: "desc" },
    limit: 100,
    include: { items: { include: { position: true } }, appliedBy: true },
  });

  useScreenReady(!isLoading);

  const adjustments = data?.data ?? [];

  const handlePress = useCallback((adjustment: SalaryAdjustment) => {
    router.push(`/recursos-humanos/reajustes/detalhes/${adjustment.id}`);
  }, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Reajustes" subtitle="Reajustes salariais" showBackButton onBackPress={() => nav.goBack()} />
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
        title="Erro ao carregar reajustes"
        message="Não foi possível carregar os reajustes salariais. Tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header title="Reajustes" subtitle="Reajustes salariais" showBackButton onBackPress={() => nav.goBack()} />
      <FlatList
        data={adjustments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SalaryAdjustmentListItem adjustment={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum reajuste"
            description="Nenhum reajuste salarial foi aplicado ainda."
            icon="percentage"
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
  skeleton: { height: 96, borderRadius: 8 },
});
