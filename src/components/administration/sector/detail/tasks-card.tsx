
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import type { Sector } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface TasksCardProps {
  sector: Sector & {
    _count?: {
      tasks?: number;
    };
  };
}

export function TasksCard({ sector }: TasksCardProps) {
  const { colors } = useTheme();

  const taskCount = sector._count?.tasks || 0;

  return (
    <DetailCard
      title="Tarefas do Setor"
      icon="clipboard-list"
      badge={
        <Badge variant="secondary">
          <ThemedText style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
            {taskCount}
          </ThemedText>
        </Badge>
      }
    >
      <View style={styles.content}>
        <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "20" }])}>
          <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
            Total de Tarefas
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
            {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
          </ThemedText>
        </View>
        {taskCount === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhuma tarefa associada a este setor.
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  infoItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    padding: spacing.md,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
