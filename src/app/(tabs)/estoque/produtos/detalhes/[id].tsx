import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconHistory, IconPackage } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import { useTheme } from "@/lib/theme";
import { useItem } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import { CHANGE_LOG_ENTITY_TYPE, routes } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import {
  ActivitiesTable,
  BorrowsTable,
  CalculationBreakdownCard,
  MetricsCard,
  OrdersTable,
  PpeInfoCard,
  RelatedItemsCard,
  SpecificationsCard,
} from "@/components/inventory/item/detail";
import type { Item } from "@/types";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useItem(id as string, {
    enabled: !!id && id !== "",
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      maxQuantity: true,
      reorderPoint: true,
      reorderQuantity: true,
      monthlyConsumption: true,
      monthlyConsumptionTrendPercent: true,
      stockLevel: true,
      hasActiveOrder: true,
      totalPrice: true,
      isActive: true,
      abcCategory: true,
      abcCategoryOrder: true,
      xyzCategory: true,
      xyzCategoryOrder: true,
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
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, fantasyName: true } },
      measures: {
        select: { id: true, value: true, unit: true, measureType: true },
      },
      prices: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, value: true, createdAt: true },
      },
      relatedItems: {
        select: {
          id: true,
          name: true,
          quantity: true,
          isActive: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
      relatedTo: {
        select: {
          id: true,
          name: true,
          quantity: true,
          isActive: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
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
  });

  return (
    <DetailScreen<Item>
      query={query as any}
      icon={IconPackage}
      title={(i) => i.name ?? "Produto"}
      editRoute={(i) => mobileRoute(routes.inventory.products.edit(i.id))}
      notFoundFallback={mobileRoute(routes.inventory.products.root)}
    >
      {(item) => (
        <View style={styles.body}>
          <SpecificationsCard item={item} />
          <MetricsCard item={item} />
          <CalculationBreakdownCard item={item} />
          {item.ppeType && <PpeInfoCard item={item} />}
          <RelatedItemsCard item={item} />

          <ActivitiesTable item={item} maxHeight={400} />
          <BorrowsTable item={item} maxHeight={400} />
          <OrdersTable item={item} maxHeight={400} />

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
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  content: {
    gap: spacing.sm,
  },
});
