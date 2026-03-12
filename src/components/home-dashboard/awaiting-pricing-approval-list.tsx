import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { DashboardCardList } from "./dashboard-card-list";
import type { HomeDashboardTask } from "@/types";

interface AwaitingPricingApprovalListProps {
  tasks: HomeDashboardTask[];
}

export function AwaitingPricingApprovalList({ tasks }: AwaitingPricingApprovalListProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <DashboardCardList
      title="Aguardando Aprov. Interna"
      icon={<Icon name="file-check" size="sm" color="#3b82f6" />}
      viewAllLink="/producao/agenda"
      emptyMessage="Nenhuma tarefa aguardando aprovação interna"
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
        <Text style={{ width: 70, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }} numberOfLines={1}>
          Identif.
        </Text>
      </View>
      {/* Table rows */}
      {tasks.map((task, index) => {
        const rowBg = index % 2 === 1 ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : undefined;
        return (
          <Pressable
            key={task.id}
            onPress={() => router.push(`/(tabs)/producao/agenda/detalhes/${task.id}` as any)}
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
              {task.name || "Tarefa Sem Nome"}
            </Text>
            <Text style={{ width: 80, fontSize: 12, color: colors.foreground }} numberOfLines={1}>
              {task.customerName || "\u2014"}
            </Text>
            <Text style={{ width: 70, fontSize: 12, fontFamily: "monospace", color: colors.foreground }} numberOfLines={1}>
              {task.serialNumber || task.plate || "\u2014"}
            </Text>
          </Pressable>
        );
      })}
    </DashboardCardList>
  );
}
