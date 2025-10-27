import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconClipboardList } from "@tabler/icons-react-native";
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
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconClipboardList size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Tarefas do Setor
          </ThemedText>
          <Badge variant="secondary">
            <ThemedText style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
              {taskCount}
            </ThemedText>
          </Badge>
        </View>
      </View>
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
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
