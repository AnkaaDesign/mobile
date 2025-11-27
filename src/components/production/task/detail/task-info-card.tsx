import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

import type { Task } from '../../../../types';
import { TaskStatusBadge } from "../list/task-status-badge";
import { formatChassis } from "@/utils";

import {
  IconHash,
  IconBuildingFactory2,
  IconBuilding,
  IconCar,
  IconBarcode,
  IconTruck,
  IconFileText,
  IconClipboardList,
} from "@tabler/icons-react-native";

interface TaskInfoCardProps {
  task: Task & {
    // Note: plate and chassisNumber are accessed via task.truck.plate and task.truck.chassisNumber
    truck?: {
      id: string;
      name?: string;
      width?: number;
      height?: number;
      plate?: string;
      chassisNumber?: string;
    };
    customer?: {
      fantasyName: string;
    };
    details?: string;
  };
  truckDimensions?: {
    width: number;
    height: number;
  } | null;
}

export const TaskInfoCard: React.FC<TaskInfoCardProps> = ({ task, truckDimensions }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconClipboardList size={20} color={colors.primary} />
          <ThemedText style={styles.title}>Informações Gerais</ThemedText>
        </View>
        <TaskStatusBadge status={task.status} size="md" />
      </View>

      <View style={styles.content}>
        {/* Customer */}
        {task.customer && (
          <View style={styles.infoItem}>
            <IconBuilding size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Cliente</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.customer.fantasyName}</ThemedText>
            </View>
          </View>
        )}

        {/* Sector */}
        {task.sector && (
          <View style={styles.infoItem}>
            <IconBuildingFactory2 size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Setor</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.sector.name}</ThemedText>
            </View>
          </View>
        )}

        {/* Serial Number */}
        {task.serialNumber && (
          <View style={styles.infoItem}>
            <IconHash size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Número de Série</ThemedText>
              <ThemedText style={[styles.value, styles.monoValue, { color: colors.foreground }]}>{task.serialNumber}</ThemedText>
            </View>
          </View>
        )}

        {/* Plate */}
        {task.truck?.plate && (
          <View style={styles.infoItem}>
            <IconCar size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Placa</ThemedText>
              <ThemedText style={[styles.value, styles.monoValue, { color: colors.foreground }]}>{task.truck.plate.toUpperCase()}</ThemedText>
            </View>
          </View>
        )}

        {/* Chassis Number */}
        {task.truck?.chassisNumber && (
          <View style={styles.infoItem}>
            <IconBarcode size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nº Chassi</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{formatChassis(task.truck.chassisNumber)}</ThemedText>
            </View>
          </View>
        )}

        {/* Truck Dimensions */}
        {task.truck && truckDimensions && (
          <View style={styles.infoItem}>
            <IconTruck size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Caminhão</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {truckDimensions.width}cm × {truckDimensions.height}cm
              </ThemedText>
            </View>
          </View>
        )}

        {/* Details - at bottom with separator */}
        {task.details && (
          <>
            <Separator style={styles.separator} />
            <View>
              <View style={styles.detailsHeader}>
                <IconFileText size={20} color={colors.mutedForeground} />
                <ThemedText style={[styles.detailsTitle, { color: colors.foreground }]}>Detalhes</ThemedText>
              </View>
              <ThemedText style={[styles.detailsText, { color: colors.mutedForeground, backgroundColor: colors.muted + '50' }]}>
                {task.details}
              </ThemedText>
            </View>
          </>
        )}
      </View>
    </Card>
  );
};

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
  content: {
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  infoItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  monoValue: {
    fontFamily: "monospace",
  },
  separator: {
    marginVertical: spacing.md,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  detailsText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    padding: spacing.md,
    borderRadius: 8,
  },
});