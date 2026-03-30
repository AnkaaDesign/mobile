import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { DashboardCardList } from "./dashboard-card-list";
import type { HomeDashboardTask } from "@/types";

function getExpirationColor(expiresAt: string | null | undefined): string | undefined {
  if (!expiresAt) return undefined;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "#ef4444";
  if (diffDays <= 3) return "#ef4444";
  if (diffDays <= 7) return "#f97316";
  return undefined;
}

function formatExpirationLabel(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "\u2014";
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dateStr = new Date(expiresAt).toLocaleDateString("pt-BR");
  if (diffDays < 0) return `${dateStr} (vencido)`;
  return dateStr;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface AwaitingBudgetApprovalListProps {
  tasks: HomeDashboardTask[];
}

export function AwaitingBudgetApprovalList({ tasks }: AwaitingBudgetApprovalListProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <DashboardCardList
      title="Orçamentos Aguardando Aprovação"
      icon={<Icon name="file-invoice" size="sm" color="#f97316" />}
      viewAllLink="/financeiro/orcamento"
      emptyMessage="Nenhum orçamento aguardando aprovação"
      isEmpty={tasks.length === 0}
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
          Logomarca
        </Text>
        <Text style={{ width: 80, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }} numberOfLines={1}>
          Cliente
        </Text>
        <Text style={{ width: 60, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground, textAlign: "right" }} numberOfLines={1}>
          Valor
        </Text>
        <Text style={{ width: 70, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground, textAlign: "right" }} numberOfLines={1}>
          Validade
        </Text>
      </View>
      {/* Table rows */}
      {tasks.map((task, index) => {
        const rowBg = index % 2 === 1 ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : undefined;
        const expirationColor = getExpirationColor(task.quoteExpiresAt);
        return (
          <Pressable
            key={task.id}
            onPress={() => router.push(`/(tabs)/financeiro/orcamento/detalhes/${task.id}` as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: index < tasks.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              backgroundColor: rowBg,
            }}
          >
            <Text style={{ flex: 1, fontSize: 13, color: colors.foreground }} numberOfLines={1}>
              {task.name || "Sem Nome"}
            </Text>
            <Text style={{ width: 80, fontSize: 12, color: colors.foreground }} numberOfLines={1}>
              {task.customerName || "\u2014"}
            </Text>
            <Text style={{ width: 60, fontSize: 12, fontFamily: "monospace", color: colors.foreground, textAlign: "right" }} numberOfLines={1}>
              {task.quoteTotal != null ? formatCurrency(task.quoteTotal) : "\u2014"}
            </Text>
            <Text
              style={{
                width: 70,
                fontSize: 11,
                textAlign: "right",
                color: expirationColor || colors.mutedForeground,
                fontWeight: expirationColor ? "600" : "400",
              }}
              numberOfLines={1}
            >
              {formatExpirationLabel(task.quoteExpiresAt)}
            </Text>
          </Pressable>
        );
      })}
    </DashboardCardList>
  );
}
