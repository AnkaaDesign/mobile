import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";

import type { Task, Truck } from '../../../../types';
import type { Representative } from '@/types/representative';
import {
  REPRESENTATIVE_ROLE_LABELS,
  RepresentativeRole,
} from '@/types/representative';
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
  IconBrandWhatsapp,
  IconUsers,
} from "@tabler/icons-react-native";
import { TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS, COMMISSION_STATUS_LABELS } from "@/constants/enum-labels";

// Format phone number for display
const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

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
    representatives?: Representative[];
    details?: string;
  };
  truckDimensions?: {
    width: number;
    height: number;
  } | null;
  /** Whether user can view financial fields (invoiceTo, commission). Defaults to false for safety. */
  canViewFinancialFields?: boolean;
  /** Whether user can view restricted fields (negotiatingWith, forecastDate, representatives). Only ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER. Defaults to false for safety. */
  canViewRestrictedFields?: boolean;
}

export const TaskInfoCard: React.FC<TaskInfoCardProps> = React.memo(({ task, truckDimensions, canViewFinancialFields = false, canViewRestrictedFields = false }) => {
  const { colors } = useTheme();

  // Handle phone call
  const handleCallPhone = useCallback((phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const phoneUrl = `tel:${cleaned}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o discador');
        }
      })
      .catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o discador');
      });
  }, []);

  // Handle WhatsApp - opens app directly
  const handleWhatsApp = useCallback(async (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Add Brazil country code if not present
    const phoneWithCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    // Try opening WhatsApp app directly first
    const whatsappUrl = `whatsapp://send?phone=${phoneWithCountry}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      // If direct open fails, try web fallback
      try {
        await Linking.openURL(`https://wa.me/${phoneWithCountry}`);
      } catch {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
      }
    }
  }, []);


  // Check if we have representatives to display
  const hasRepresentatives = task.representatives && task.representatives.length > 0;

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
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconBuilding size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Cliente</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.customer?.fantasyName || "-"}</ThemedText>
            </View>
          </View>
        )}

        {/* Invoice To Customer - Only visible to ADMIN, FINANCIAL, COMMERCIAL */}
        {canViewFinancialFields && task.invoiceTo && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconReceipt size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Faturar Para</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.invoiceTo.fantasyName}</ThemedText>
            </View>
          </View>
        )}

        {/* Representatives Section - Only visible to ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER */}
        {canViewRestrictedFields && hasRepresentatives && (
          <View style={styles.representativesSection}>
            <View style={styles.representativesSectionHeader}>
              <IconUsers size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Representantes ({task.representatives!.length})
              </ThemedText>
            </View>
            {task.representatives!.map((rep) => (
              <View
                key={rep.id}
                style={[styles.representativeCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <View style={styles.representativeHeader}>
                  <View style={styles.representativeInfo}>
                    <ThemedText style={[styles.representativeName, { color: colors.foreground }]}>
                      {rep.name}
                    </ThemedText>
                    <ThemedText style={[styles.representativeRole, { color: colors.mutedForeground }]}>
                      {REPRESENTATIVE_ROLE_LABELS[rep.role as RepresentativeRole]}
                    </ThemedText>
                  </View>
                  {rep.phone && (
                    <View style={styles.representativePhoneActions}>
                      <TouchableOpacity
                        style={styles.phoneButton}
                        onPress={() => handleCallPhone(rep.phone)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[styles.phoneText, { color: "#16a34a" }]}>
                          {formatPhoneDisplay(rep.phone)}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.whatsappIconButton}
                        onPress={() => handleWhatsApp(rep.phone)}
                        activeOpacity={0.7}
                      >
                        <IconBrandWhatsapp size={20} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Legacy Negotiating With Contact - Fallback for old data without representatives */}
        {canViewRestrictedFields && !hasRepresentatives && task.negotiatingWith && (
          <View style={styles.representativesSection}>
            <View style={styles.representativesSectionHeader}>
              <IconUser size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Negociando com
              </ThemedText>
            </View>
            <View
              style={[styles.representativeCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <View style={styles.representativeHeader}>
                <View style={styles.representativeInfo}>
                  <ThemedText style={[styles.representativeName, { color: colors.foreground }]}>
                    {task.negotiatingWith.name}
                  </ThemedText>
                </View>
                {task.negotiatingWith.phone && (
                  <View style={styles.representativePhoneActions}>
                    <TouchableOpacity
                      style={styles.phoneButton}
                      onPress={() => handleCallPhone(task.negotiatingWith!.phone)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={[styles.phoneText, { color: "#16a34a" }]}>
                        {formatPhoneDisplay(task.negotiatingWith.phone)}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.whatsappIconButton}
                      onPress={() => handleWhatsApp(task.negotiatingWith!.phone)}
                      activeOpacity={0.7}
                    >
                      <IconBrandWhatsapp size={20} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Sector */}
        {task.sector && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconBuildingFactory2 size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Setor</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{task.sector.name}</ThemedText>
            </View>
          </View>
        )}

        {/* Commission Status - Only visible to ADMIN, FINANCIAL, COMMERCIAL */}
        {canViewFinancialFields && task.commission && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconCoin size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Comissão</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {COMMISSION_STATUS_LABELS[task.commission as keyof typeof COMMISSION_STATUS_LABELS] || task.commission}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Serial Number */}
        {task.serialNumber && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconHash size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Número de Série</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, styles.monoValue, { color: colors.foreground }]}>{task.serialNumber}</ThemedText>
            </View>
          </View>
        )}

        {/* Plate */}
        {task.truck?.plate && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconCar size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Placa</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, styles.monoValue, { color: colors.foreground }]}>{task.truck.plate.toUpperCase()}</ThemedText>
            </View>
          </View>
        )}

        {/* Chassis Number */}
        {task.truck?.chassisNumber && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconBarcode size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nº Chassi</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>{formatChassis(task.truck.chassisNumber)}</ThemedText>
            </View>
          </View>
        )}

        {/* Truck Category */}
        {task.truck?.category && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconCategory size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Categoria</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {TRUCK_CATEGORY_LABELS[task.truck.category as keyof typeof TRUCK_CATEGORY_LABELS]}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Implement Type */}
        {task.truck?.implementType && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconTool size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Implemento</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {IMPLEMENT_TYPE_LABELS[task.truck.implementType as keyof typeof IMPLEMENT_TYPE_LABELS]}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Truck Dimensions */}
        {task.truck && truckDimensions && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconTruck size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Caminhão</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {truckDimensions.width}cm × {truckDimensions.height}cm
              </ThemedText>
            </View>
          </View>
        )}

        {/* Local (Truck Spot) */}
        {task.truck?.spot && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <IconMapPin size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Local</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
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
});

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
  infoSection: {
    gap: spacing.xs,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
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
  representativesSection: {
    gap: spacing.sm,
  },
  representativesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  representativeCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  representativeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  representativeInfo: {
    flex: 1,
    gap: 2,
  },
  representativeName: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  representativeRole: {
    fontSize: fontSize.xs,
  },
  representativePhoneActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  phoneButton: {
    paddingVertical: 2,
  },
  phoneText: {
    fontSize: fontSize.sm,
  },
  whatsappIconButton: {
    padding: 4,
  },
});