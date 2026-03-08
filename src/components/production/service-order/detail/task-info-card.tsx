import { View, StyleSheet, TouchableOpacity } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  IconChecklist,
  IconExternalLink,
} from "@tabler/icons-react-native";
import type { ServiceOrder } from "@/types";
import { formatDate } from "@/utils";
import { router } from "expo-router";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";

interface TaskInfoCardProps {
  serviceOrder: ServiceOrder;
}

export function TaskInfoCard({ serviceOrder }: TaskInfoCardProps) {
  const { colors } = useTheme();

  if (!serviceOrder.task) {
    return (
      <DetailCard title="Tarefa Associada" icon="checklist">
        <View style={styles.emptyState}>
          <IconChecklist size={32} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhuma tarefa associada
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  const task = serviceOrder.task;

  const handleTaskPress = () => {
    if (task.id) {
      router.push(routeToMobilePath(routes.production.history.details(task.id)) as any);
    }
  };

  return (
    <DetailCard title="Tarefa Associada" icon="checklist">
      <TouchableOpacity
        style={[styles.taskCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
        onPress={handleTaskPress}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.taskName, { color: colors.foreground }]}>
              {task.name || task.details || `Tarefa #${task.id.slice(-8).toUpperCase()}`}
            </ThemedText>
            {task.details && (
              <ThemedText style={[styles.taskDetails, { color: colors.mutedForeground }]} numberOfLines={2}>
                {task.details}
              </ThemedText>
            )}
          </View>
          <IconExternalLink size={20} color={colors.mutedForeground} />
        </View>

        {task.customer && (
          <DetailField
            label="Cliente"
            icon="user"
            value={task.customer.fantasyName}
          />
        )}

        {task.term && (
          <DetailField
            label="Prazo"
            icon="calendar"
            value={formatDate(task.term)}
          />
        )}
      </TouchableOpacity>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
  taskCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  taskName: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  taskDetails: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
