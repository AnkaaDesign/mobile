import { useState, useCallback, useEffect, useRef } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useItem, useScreenReady } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/loading";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPackage, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/utils/route-mapper";
import { perfLog } from "@/utils/performance-logger";
// import { showToast } from "@/components/ui/toast";

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
  const { pushWithLoading } = useNavigationLoading();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // End navigation loading overlay when screen mounts

  // Performance logging - track screen mount
  useEffect(() => {
    perfLog.screenMount('ItemDetailScreen');
    perfLog.mark(`Item detail screen mounted for id: ${id}`);
  }, []);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useItem(id, {
    enabled: !!id && id !== "",
    // Use select to fetch only the fields needed for the detail view
    select: {
      // Core item fields needed for display
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      maxQuantity: true,
      reorderPoint: true,
      monthlyConsumption: true,
      totalPrice: true,
      isActive: true,
      abcCategory: true,
      xyzCategory: true,
      boxQuantity: true,
      estimatedLeadTime: true,
      barcodes: true,
      ppeType: true,
      ppeSize: true,
      ppeCA: true,
      ppeDeliveryMode: true,
      ppeStandardQuantity: true,
      shouldAssignToUser: true,
      createdAt: true,
      // Related entities with only needed fields
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      supplier: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
      measures: {
        select: {
          id: true,
          value: true,
          unit: true,
          measureType: true,
        },
      },
      prices: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          value: true,
          createdAt: true,
        },
      },
      // Related items - only fields shown in RelatedItemsCard
      relatedItems: {
        select: {
          id: true,
          name: true,
          quantity: true,
          isActive: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      relatedTo: {
        select: {
          id: true,
          name: true,
          quantity: true,
          isActive: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      // Counts only - tables fetch their own data via separate hooks
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
  });

  useScreenReady(!isLoading);

  const item = response?.data;

  // Performance logging - track when data is ready
  useEffect(() => {
    if (!isLoading && item) {
      perfLog.dataReady('ItemDetailScreen', 'useItem');
      perfLog.mark(`Item data loaded: ${item.name || item.id}`);
    }
  }, [isLoading, item]);

  // Performance logging - track when screen content is rendered
  useEffect(() => {
    if (!isLoading && item) {
      requestAnimationFrame(() => {
        perfLog.screenRendered('ItemDetailScreen');
        perfLog.getSummary();
      });
    }
  }, [isLoading, item]);

  const handleEdit = () => {
    if (item) {
      pushWithLoading(routeToMobilePath(routes.inventory.products.edit(item.id)));
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
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
            <View style={styles.headerLeft}>
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
