
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  IconChecklist,
  IconUser,
  IconCalendar,
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
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconChecklist size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Tarefa Associada</ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.emptyState}>
            <IconChecklist size={32} color={colors.mutedForeground} />
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma tarefa associada
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  const task = serviceOrder.task;

  const handleTaskPress = () => {
    if (task.id) {
      // Navigate to task detail page
      router.push(routeToMobilePath(routes.production.history.details(task.id)) as any);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconChecklist size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Tarefa Associada</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
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

          {/* Customer Info */}
          {task.customer && (
            <View style={styles.infoRow}>
              <IconUser size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
                {task.customer.fantasyName}
              </ThemedText>
            </View>
          )}

          {/* Dates */}
          <View style={styles.dateRow}>
            {/* Fixed: scheduledDate doesn't exist, using term (deadline) instead */}
            {task.term && (
              <View style={styles.infoRow}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {formatDate(task.term)}
                </ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
