import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useItem } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/loading";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPackage, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/utils/route-mapper";
import { showToast } from "@/components/ui/toast";

// Import modular components
import {
  MetricsCard,
  RelatedItemsCard,
  SpecificationsCard,
  PpeInfoCard,
  ActivitiesTable,
  BorrowsTable,
  OrdersTable,
} from "@/components/inventory/item/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function ItemDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useItem(id, {
    include: {
      brand: true,
      category: true,
      supplier: true,
      measures: true,
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
      _count: {
        select: {
          activities: true,
          borrows: true,
          orderItems: true,
          prices: true,
          measures: true,
          relatedItems: true,
          relatedTo: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const item = response?.data;

  const handleEdit = () => {
    if (item) {
      router.push(routeToMobilePath(routes.inventory.products.edit(item.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <View style={styles.skeletonContainer}>
            <SkeletonCard style={styles.headerSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !item || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconPackage size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Produto não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O produto solicitado não foi encontrado ou pode ter sido removido.
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
        {/* Item Name Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconPackage size={24} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.itemName, { color: colors.foreground }])}>
                {item.name}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEdit}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                activeOpacity={0.7}
              >
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Modular Components */}
        <SpecificationsCard item={item} />
        <MetricsCard item={item} />
        {item.ppeType && <PpeInfoCard item={item} />}
        <RelatedItemsCard item={item} />

        {/* Related Data Tables */}
        <ActivitiesTable item={item} maxHeight={400} />
        <BorrowsTable item={item} maxHeight={400} />
        <OrdersTable item={item} maxHeight={400} />

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.changelogHeaderLeft}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.ITEM}
              entityId={item.id}
              entityName={item.name}
              entityCreatedAt={item.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.md }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  changelogHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonContainer: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  headerSkeleton: {
    height: 60,
  },
  fullWidthSkeleton: {
    height: 200,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
