import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePpeDelivery, useScreenReady } from '@/hooks';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconShieldCheck } from "@tabler/icons-react-native";
import { useAuth } from "@/contexts/auth-context";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants/enums";
import { isTeamLeader } from "@/utils/user";

// Import modular components
import {
  TeamPpeDeliveryCard,
  TeamPpeEmployeeCard,
  TeamPpeItemCard,
  TeamPpeStatusCard,
} from "@/components/my-team/ppe-delivery/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function TeamPpeDeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDelivery(id, {
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      reviewedByUser: true,
      ppeSchedule: true,
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const delivery = response?.data;

  // Note: Team leaders can only VIEW deliveries, not edit or delete them.
  // Edit/delete actions are only available for Warehouse (edit PENDING) and Admin (delete PENDING)
  // in the HR/Warehouse PPE delivery pages.

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch()
      .then(() => {
        Alert.alert("Sucesso", "Dados atualizados com sucesso");
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [refetch]);

  // Check if user has access (team leader with matching sector)
  const managedSectorId = currentUser?.managedSector?.id;
  const hasAccess = currentUser && isTeamLeader(currentUser) && delivery?.user?.sectorId === managedSectorId;

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          {/* Header card skeleton */}
          <Card style={styles.headerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Skeleton style={{ width: 24, height: 24, borderRadius: 12 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
                <Skeleton style={{ height: 13, width: '35%', borderRadius: 4 }} />
              </View>
            </View>
          </Card>
          {/* Employee card skeleton */}
          <Card style={styles.card}>
            <Skeleton style={{ height: 16, width: '40%', borderRadius: 4, marginBottom: spacing.sm }} />
            <View style={{ gap: 10 }}>
              {[['25%', '40%'], ['20%', '35%']].map(([l, r], i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width={l} height={14} borderRadius={4} />
                  <Skeleton width={r} height={14} borderRadius={4} />
                </View>
              ))}
            </View>
          </Card>
          {/* Item card skeleton */}
          <Card style={styles.card}>
            <Skeleton style={{ height: 16, width: '35%', borderRadius: 4, marginBottom: spacing.sm }} />
            <View style={{ gap: 10 }}>
              {[['28%', '45%'], ['22%', '30%'], ['30%', '25%']].map(([l, r], i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width={l} height={14} borderRadius={4} />
                  <Skeleton width={r} height={14} borderRadius={4} />
                </View>
              ))}
            </View>
          </Card>
          {/* Delivery card skeleton */}
          <Card style={styles.card}>
            <Skeleton style={{ height: 16, width: '45%', borderRadius: 4, marginBottom: spacing.sm }} />
            <View style={{ gap: 10 }}>
              {[['25%', '35%'], ['30%', '28%']].map(([l, r], i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width={l} height={14} borderRadius={4} />
                  <Skeleton width={r} height={14} borderRadius={4} />
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>
    );
  }

  if (error || !delivery || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconShieldCheck size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Entrega não encontrada
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                A entrega solicitada não foi encontrada ou pode ter sido removida.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  // Access denied if not team leader of the employee's sector
  if (!hasAccess) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconShieldCheck size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Acesso Restrito
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                Você não tem permissão para visualizar esta entrega.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header Card - Team leaders can only view, not edit/delete */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <IconShieldCheck size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={StyleSheet.flatten([styles.deliveryTitle, { color: colors.foreground }])} numberOfLines={1}>
                  {delivery.item?.name || "Entrega de EPI"}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.deliverySubtitle, { color: colors.mutedForeground }])} numberOfLines={1}>
                  {delivery.user?.name}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {/* Modular Components */}
        <TeamPpeEmployeeCard delivery={delivery} />
        <TeamPpeItemCard delivery={delivery} />
        <TeamPpeDeliveryCard delivery={delivery} />
        <TeamPpeStatusCard delivery={delivery} />

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconShieldCheck size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>
                Histórico de Alterações
              </ThemedText>
            </View>
          </View>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.PPE_DELIVERY}
            entityId={delivery.id}
            entityName={`${delivery.user?.name} - ${delivery.item?.name}`}
            entityCreatedAt={delivery.createdAt}
            maxHeight={400}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deliveryTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  deliverySubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  errorContent: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
