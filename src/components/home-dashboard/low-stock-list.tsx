import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { IconAlertTriangleFilled, IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { DashboardCardList } from "./dashboard-card-list";
import { determineStockLevel } from "@/utils/stock-level";
import { STOCK_LEVEL, STOCK_LEVEL_LABELS } from "@/constants";
import type { HomeDashboardLowStockItem } from "@/types";

const ITEMS_PER_PAGE = 20;

function getStockLevelHexColor(level: STOCK_LEVEL): string {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return "#737373";
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "#dc2626";
    case STOCK_LEVEL.CRITICAL:
      return "#f97316";
    case STOCK_LEVEL.LOW:
      return "#eab308";
    case STOCK_LEVEL.OPTIMAL:
      return "#16a34a";
    case STOCK_LEVEL.OVERSTOCKED:
      return "#9333ea";
    default:
      return "#737373";
  }
}

interface LowStockListProps {
  items: HomeDashboardLowStockItem[];
  totalCount?: number;
}

export function LowStockList({ items, totalCount }: LowStockListProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const pagedItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const start = items.length > 0 ? page * ITEMS_PER_PAGE + 1 : 0;
  const end = Math.min((page + 1) * ITEMS_PER_PAGE, items.length);

  const pagination = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{start}–{end} de {items.length}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{ opacity: page === 0 ? 0.3 : 1 }}
        >
          <IconChevronLeft size={16} color={colors.mutedForeground} />
        </Pressable>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{page + 1}/{totalPages}</Text>
        <Pressable
          onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}
        >
          <IconChevronRight size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <DashboardCardList
      title="Estoque Baixo"
      icon={<Icon name="package" size="sm" color="#eab308" />}
      viewAllLink="/estoque/produtos"
      emptyMessage="Nenhum item com estoque baixo"
      isEmpty={items.length === 0}
      footer={pagination}
    >
      {/* Table header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: colors.muted,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Item
        </Text>
        <Text style={{ width: 60, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Marca
        </Text>
        <Text style={{ width: 56, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Qnt
        </Text>
        <Text style={{ width: 48, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Cons.
        </Text>
      </View>
      {/* Table rows */}
      {pagedItems.map((item, index) => {
        const stockLevel = determineStockLevel(
          item.quantity,
          item.reorderPoint || null,
          item.maxQuantity,
          false,
        );
        const hexColor = getStockLevelHexColor(stockLevel);
        const stockLabel = STOCK_LEVEL_LABELS[stockLevel] || "";
        const rowBg = index % 2 === 1 ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : undefined;

        return (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/estoque/itens/${item.id}` as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: index < pagedItems.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              backgroundColor: rowBg,
            }}
          >
            <Text style={{ flex: 1, fontSize: 13, color: colors.foreground }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{ width: 60, fontSize: 12, color: colors.foreground }} numberOfLines={1}>
              {item.brandName || "—"}
            </Text>
            <View style={{ width: 56, flexDirection: "row", alignItems: "center", gap: 3 }}>
              <IconAlertTriangleFilled size={12} color={hexColor} />
              <Text style={{ fontSize: 12, color: hexColor, fontVariant: ["tabular-nums"] }} accessibilityLabel={stockLabel}>
                {item.quantity % 1 === 0
                  ? item.quantity.toLocaleString("pt-BR")
                  : item.quantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <Text style={{ width: 48, fontSize: 12, color: colors.foreground, fontVariant: ["tabular-nums"] }}>
              {item.monthlyConsumption > 0
                ? item.monthlyConsumption.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                : "—"}
            </Text>
          </Pressable>
        );
      })}
    </DashboardCardList>
  );
}
