import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useItem } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { IconShield, IconRefresh, IconEdit, IconHistory, IconAlertTriangle } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import item detail components (matching web pattern)
import { SpecificationsCard, MetricsCard, PpeInfoCard, ActivityHistoryCard, RelatedItemsCard } from "@/components/inventory/item/detail";

// Import skeleton
import { PpeDetailSkeleton } from "@/components/human-resources/ppe/skeleton";

export default function PPEDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Fetch the item with all necessary includes (matching web pattern)
  const {
    data: itemResponse,
    isLoading: itemLoading,
    error: itemError,
    refetch: refetchItem,
  } = useItem(id, {
    include: {
      brand: true,
      category: true,
      supplier: true,
      prices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      activities: {
        include: {
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      relatedItems: {
        include: {
          brand: true,
          category: true,
        },
      },
      relatedTo: {
        include: {
          brand: true,
          category: true,
        },
      },
      orderItems: {
        include: {
          order: {
            include: {
              supplier: true,
              items: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      borrows: {
        include: {
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      changeLogs: {
        include: {
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    enabled: !!id && id !== "",
  });

  const item = itemResponse?.data;

  const handleEdit = () => {
    if (item) {
      router.push(routeToMobilePath(routes.humanResources.ppe.edit(item.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetchItem().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetchItem]);

  if (itemLoading) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <PpeDetailSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (itemError || !item || !id || id === "" || !item.ppeType) {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header
          title="EPI não encontrado"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                  <IconShield size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                  EPI não encontrado
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                  O EPI que você está procurando não existe ou foi removido do sistema.
                </ThemedText>
                <Button onPress={() => router.push(routeToMobilePath(routes.humanResources.ppe.root) as any)}>
                  <ThemedText style={{ color: colors.primaryForeground }}>Ir para Lista de EPIs</ThemedText>
                </Button>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Header */}
      <Header
        title={item.name}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        }
      />

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
          {/* Core Information Grid - Specifications and Metrics */}
          <SpecificationsCard item={item} />
          <MetricsCard item={item} />

          {/* PPE Information - Always show for EPIs */}
          <PpeInfoCard item={item} />

          {/* Activity History */}
          <ActivityHistoryCard item={item} />

          {/* Changelog Timeline */}
          <Card>
            <View style={styles.changelogHeader}>
              <View style={styles.titleRow}>
                <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                  <IconHistory size={18} color={colors.primary} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </View>
            <View style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.ITEM}
                entityId={item.id}
                entityName={item.name}
                entityCreatedAt={item.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>

          {/* Related Items */}
          <RelatedItemsCard item={item} />

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  changelogHeader: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
