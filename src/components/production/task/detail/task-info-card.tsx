import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

import type { Task, Truck } from '../../../../types';
import { TaskStatusBadge } from "../list/task-status-badge";
import { formatChassis } from "@/utils";
import { getSpotLabel } from "@/types/garage";

import {
  IconHash,
  IconBuildingFactory2,
  IconBuilding,
  IconCar,
  IconBarcode,
  IconTruck,
  IconFileText,
  IconClipboardList,
  IconMapPin,
  IconReceipt,
  IconUser,
  IconPhone,
  IconCategory,
  IconTool,
  IconCoin,
} from "@tabler/icons-react-native";
import { TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS, COMMISSION_STATUS_LABELS } from "@/constants/enum-labels";

interface TaskInfoCardProps {
  task: Task & {
    truck?: Truck;
    customer?: {
      fantasyName: string;
    };
    invoiceTo?: {
      fantasyName: string;
    };
    negotiatingWith?: {
      name: string;
      phone: string;
    };
    details?: string;
  };
  truckDimensions?: {
    width: number;
    height: number;
  } | null;
  /** Whether user can view financial fields (invoiceTo, commission). Defaults to false for safety. */
  canViewFinancialFields?: boolean;
  /** Whether user can view restricted fields (negotiatingWith, forecastDate). Only ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER. Defaults to false for safety. */
  canViewRestrictedFields?: boolean;
}

export const TaskInfoCard: React.FC<TaskInfoCardProps> = ({ task, truckDimensions, canViewFinancialFields = false, canViewRestrictedFields = false }) => {
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
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.customer?.fantasyName || "-"}</ThemedText>
            </View>
          </View>
        )}

        {/* Invoice To Customer - Only visible to ADMIN, FINANCIAL, COMMERCIAL */}
        {canViewFinancialFields && task.invoiceTo && (
          <View style={styles.infoItem}>
            <IconReceipt size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Faturar Para</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.invoiceTo.fantasyName}</ThemedText>
            </View>
          </View>
        )}

        {/* Negotiating With Contact - Only visible to ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER */}
        {canViewRestrictedFields && task.negotiatingWith && (
          <View style={styles.infoItem}>
            <IconUser size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Negociando com</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.negotiatingWith.name}</ThemedText>
              {task.negotiatingWith.phone && (
                <ThemedText style={[styles.subtext, { color: colors.mutedForeground }]}>
                  <IconPhone size={12} color={colors.mutedForeground} /> {task.negotiatingWith.phone}
                </ThemedText>
              )}
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

        {/* Commission Status - Only visible to ADMIN, FINANCIAL, COMMERCIAL */}
        {canViewFinancialFields && task.commission && (
          <View style={styles.infoItem}>
            <IconCoin size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Comissão</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {COMMISSION_STATUS_LABELS[task.commission as keyof typeof COMMISSION_STATUS_LABELS] || task.commission}
              </ThemedText>
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

        {/* Truck Category */}
        {task.truck?.category && (
          <View style={styles.infoItem}>
            <IconCategory size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Categoria</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {TRUCK_CATEGORY_LABELS[task.truck.category as keyof typeof TRUCK_CATEGORY_LABELS]}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Implement Type */}
        {task.truck?.implementType && (
          <View style={styles.infoItem}>
            <IconTool size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Implemento</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {IMPLEMENT_TYPE_LABELS[task.truck.implementType as keyof typeof IMPLEMENT_TYPE_LABELS]}
              </ThemedText>
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

        {/* Local (Truck Spot) */}
        {task.truck?.spot && (
          <View style={styles.infoItem}>
            <IconMapPin size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Local</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {getSpotLabel(task.truck.spot as any)}
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
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
    flexShrink: 1,
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
  subtext: {
    fontSize: fontSize.xs,
    marginTop: 2,
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