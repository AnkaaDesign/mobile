
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { router } from "expo-router";
import type { Sector } from '../../../../types';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

interface SectorTasksCardProps {
  sector: Sector;
}

export function SectorTasksCard({ sector }: SectorTasksCardProps) {
  const { colors } = useTheme();

  const taskCount = sector._count?.tasks || 0;

  const handleViewAllTasks = () => {
    router.push(routeToMobilePath(`${routes.production.history.root}?sectorId=${sector.id}`) as any);
  };

  return (
    <DetailCard
      title="Tarefas do Setor"
      icon="clipboard-list"
      badge={
        <TouchableOpacity
          onPress={handleViewAllTasks}
          style={[styles.viewAllButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.viewAllText, { color: colors.foreground }]}>
            Ver todas as tarefas
          </ThemedText>
        </TouchableOpacity>
      }
    >

      <View style={styles.content}>
        <View style={[styles.statsContainer, { backgroundColor: colors.muted + "20" }]}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Total de Tarefas
            </ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
              {taskCount}
            </ThemedText>
          </View>
        </View>

        {taskCount === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma tarefa associada a este setor.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
              Este setor possui {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'} associada{taskCount === 1 ? '' : 's'}.
            </ThemedText>
            <ThemedText style={[styles.infoSubtext, { color: colors.mutedForeground }]}>
              Clique em "Ver todas as tarefas" para visualizar os detalhes.
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  viewAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  statsContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  statItem: {
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  infoBox: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  infoSubtext: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
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
