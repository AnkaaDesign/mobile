
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { IconClipboardList } from "@tabler/icons-react-native";
import { router } from "expo-router";
import type { Sector } from '../../../../types';
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
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
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <IconClipboardList size={20} color={colors.primary} />
          <ThemedText style={styles.sectionTitle}>Tarefas do Setor</ThemedText>
        </View>
        <TouchableOpacity
          onPress={handleViewAllTasks}
          style={[styles.viewAllButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.viewAllText, { color: colors.foreground }]}>
            Ver todas as tarefas
          </ThemedText>
        </TouchableOpacity>
      </View>

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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
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
