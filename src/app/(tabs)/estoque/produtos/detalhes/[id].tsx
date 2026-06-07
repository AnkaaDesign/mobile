import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconHistory, IconPackage } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import { useTheme } from "@/lib/theme";
import { useItem, useOrderSchedules, useOrderScheduleProjection } from "@/hooks";
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
  });

  // This item's purchasing is governed by any active order schedule that lists it.
  // The schedule's projected "expected" quantity (gap + one cycle) is what actually
  // gets ordered — so surface that on the detail page instead of the standalone
  // restock-to-max suggestion, which is never used for scheduled items.
  const { data: schedulesResponse } = useOrderSchedules(
    { where: { isActive: true }, limit: 100 },
    { enabled: !!id },
  );

  const targetSchedule = useMemo(() => {
    if (!id) return null;
    const matches = (schedulesResponse?.data || []).filter(
      (s) => Array.isArray(s.items) && s.items.includes(id as string),
    );
    // Prefer the schedule that fires soonest — that's the next order this item will be in.
    return (
      matches.sort(
        (a, b) =>
          new Date(a.nextRun || 0).getTime() - new Date(b.nextRun || 0).getTime(),
      )[0] || null
    );
  }, [schedulesResponse, id]);

  const { data: scheduleProjectionResponse } = useOrderScheduleProjection(
    targetSchedule?.id || "",
    { enabled: !!targetSchedule?.id },
  );

  const scheduledNextOrder = useMemo(() => {
    if (!targetSchedule) return null;
    const projItem = scheduleProjectionResponse?.data?.items?.find(
      (p) => p.itemId === id,
    );
    if (!projItem) return null;
    return {
      quantity: projItem.quantityGapPlusCycle,
      scheduleName: targetSchedule.name,
      scheduleId: targetSchedule.id,
      nextRun:
        scheduleProjectionResponse?.data?.meta?.nextRun ?? targetSchedule.nextRun ?? null,
    };
  }, [targetSchedule, scheduleProjectionResponse, id]);

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
          <CalculationBreakdownCard item={item} scheduledNextOrder={scheduledNextOrder} />
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
