import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { DashboardCardList } from "./dashboard-card-list";
import type { HomeDashboardTask } from "@/types";

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function getTermTextColor(term: string | null): string {
  if (!term) return "#737373";

  const now = new Date();
  const deadline = new Date(term);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) {
    return "#ef4444"; // red
  }

  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining <= 4) {
    return "#f59e0b"; // amber
  }

  return "#22c55e"; // green
}

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

interface TaskDeadlineListProps {
  tasks: HomeDashboardTask[];
  title?: string;
  viewAllLink?: string;
  variant?: "deadline" | "forecast";
}

export function TaskDeadlineList({
  tasks,
  title = "Tarefas com Prazo Hoje",
  viewAllLink = "/producao/agenda",
  variant = "deadline",
}: TaskDeadlineListProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isDeadline = variant === "deadline";
  const dateColumnLabel = isDeadline ? "Prazo" : "Liberação";

  return (
    <DashboardCardList
      title={title}
      icon={<Icon name="calendar-event" size="sm" color="#ef4444" />}
      viewAllLink={viewAllLink}
      emptyMessage={isDeadline ? "Nenhuma tarefa com prazo vencendo hoje" : "Nenhuma tarefa com liberação próxima"}
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
        <Text style={{ width: 70, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }} numberOfLines={1}>
          Identif.
        </Text>
        <Text style={{ width: 72, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground }}>
          {dateColumnLabel}
        </Text>
      </View>
      {/* Table rows */}
      {tasks.map((task, index) => {
        const dateValue = isDeadline ? task.term : task.forecastDate;
        const rowBg = index % 2 === 1 ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : undefined;
        const dateColor = isDeadline
          ? getTermTextColor(task.term)
          : getForecastUrgencyColor(task.forecastDate, colors.foreground);

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
            <Text style={{ width: 70, fontSize: 12, fontFamily: "monospace", color: colors.foreground }} numberOfLines={1}>
              {task.serialNumber || task.plate || "—"}
            </Text>
            <Text style={{ width: 72, fontSize: 12, color: dateColor, fontVariant: ["tabular-nums"] }}>
              {dateValue ? formatDateTime(dateValue) : "—"}
            </Text>
          </Pressable>
        );
      })}
    </DashboardCardList>
  );
}
