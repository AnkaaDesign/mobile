import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { DashboardCardList } from "./dashboard-card-list";
import type { HomeDashboardServiceOrder } from "@/types";

const SO_TYPE_COLORS: Record<string, string> = {
  PRODUCTION: "#2563eb",
  FINANCIAL: "#16a34a",
  COMMERCIAL: "#9333ea",
  LOGISTIC: "#f59e0b",
  ARTWORK: "#ea580c",
};

const SO_TYPE_LABELS: Record<string, string> = {
  COMMERCIAL: "Comercial",
  LOGISTIC: "Logística",
  ARTWORK: "Arte",
  FINANCIAL: "Financeiro",
  PRODUCTION: "Produção",
};

function getForecastUrgencyColor(forecastDate: string | null, defaultColor: string): string {
  if (!forecastDate) return defaultColor;

  const now = new Date();
  const forecast = new Date(forecastDate);
  const diffDays = Math.ceil((forecast.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return "#ef4444"; // red
  if (diffDays <= 7) return "#f97316"; // orange
  if (diffDays <= 10) return "#eab308"; // yellow
  return defaultColor;
}

interface ServiceOrderListProps {
  orders: HomeDashboardServiceOrder[];
  title?: string;
}

export function ServiceOrderList({ orders, title = "Ordens de Serviço Abertas" }: ServiceOrderListProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <DashboardCardList
      title={title}
      icon={<Icon name="clipboard-list" size="sm" color="#3b82f6" />}
      viewAllLink="/producao/agenda"
      emptyMessage="Nenhuma ordem de serviço aberta"
      isEmpty={orders.length === 0}
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
          Ordem de Serviço
        </Text>
        <Text style={{ width: 64, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Tarefa
        </Text>
        <Text style={{ width: 60, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }} numberOfLines={1}>
          Identif.
        </Text>
        <Text style={{ width: 72, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          Liberação
        </Text>
      </View>
      {/* Table rows */}
      {orders.map((order, index) => {
        const badgeBg = SO_TYPE_COLORS[order.type] || "#6b7280";
        const rowBg = index % 2 === 1 ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : undefined;
        const forecastColor = getForecastUrgencyColor(
          order.taskForecastDate as unknown as string,
          colors.foreground,
        );
        return (
          <Pressable
            key={order.id}
            onPress={() => router.push(`/(tabs)/producao/agenda/detalhes/${order.taskId}` as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: index < orders.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              backgroundColor: rowBg,
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={{ fontSize: 13, color: colors.foreground, flexShrink: 1 }} numberOfLines={1}>
                {order.description}
              </Text>
              <View style={{ backgroundColor: badgeBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                <Text style={{ fontSize: 8, fontWeight: "600", color: "#ffffff" }}>
                  {SO_TYPE_LABELS[order.type] || order.type}
                </Text>
              </View>
            </View>
            <Text style={{ width: 64, fontSize: 12, color: colors.foreground }} numberOfLines={1}>
              {order.taskName || "—"}
            </Text>
            <Text style={{ width: 60, fontSize: 12, fontFamily: "monospace", color: colors.foreground }} numberOfLines={1}>
              {order.taskSerialNumber || "—"}
            </Text>
            <Text style={{ width: 72, fontSize: 12, color: forecastColor, fontVariant: ["tabular-nums"] }}>
              {order.taskForecastDate ? new Date(order.taskForecastDate).toLocaleDateString("pt-BR") : "—"}
            </Text>
          </Pressable>
        );
      })}
    </DashboardCardList>
  );
}
