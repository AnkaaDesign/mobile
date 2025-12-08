
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { TASK_STATUS_LABELS } from "@/constants";
import { IconAlertCircle, IconTruck, IconCircleCheck, IconUser, IconBuildingFactory } from "@tabler/icons-react-native";
import type { Observation } from "@/types";

interface ObservationInfoCardProps {
  observation: Observation & {
    task?: {
      id: string;
      name: string;
      status: string;
      customer?: {
        id: string;
        fantasyName: string;
        corporateName?: string | null;
      };
      sector?: {
        id: string;
        name: string;
      };
    };
  };
}

export function ObservationInfoCard({ observation }: ObservationInfoCardProps) {
  const { colors } = useTheme();

  const getTaskStatusBadgeVariant = (status: string) => {
    return getBadgeVariantFromStatus(status);
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconAlertCircle size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Description Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
            Descrição
          </ThemedText>
          <View style={[styles.descriptionBox, { backgroundColor: colors.muted }]}>
            <ThemedText style={[styles.descriptionText, { color: colors.foreground }]}>
              {observation.description}
            </ThemedText>
          </View>
        </View>

        {/* Task Information Section */}
        {observation.task && (
          <View style={[styles.section, styles.sectionWithBorder, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Tarefa Relacionada
            </ThemedText>
            <View style={styles.detailsContainer}>
              {/* Task Name */}
              <View style={[styles.detailRow, { backgroundColor: colors.muted }]}>
                <View style={styles.detailLabelContainer}>
                  <IconTruck size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Nome da Tarefa
                  </ThemedText>
                </View>
                <ThemedText style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={2}>
                  {observation.task.name}
                </ThemedText>
              </View>

              {/* Task Status */}
              <View style={[styles.detailRow, { backgroundColor: colors.muted }]}>
                <View style={styles.detailLabelContainer}>
                  <IconCircleCheck size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Status
                  </ThemedText>
                </View>
                <Badge variant={getTaskStatusBadgeVariant(observation.task.status)}>
                  {TASK_STATUS_LABELS[observation.task.status] || observation.task.status}
                </Badge>
              </View>

              {/* Customer */}
              {observation.task.customer && (
                <View style={[styles.detailRow, { backgroundColor: colors.muted }]}>
                  <View style={styles.detailLabelContainer}>
                    <IconUser size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Cliente
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                    {observation.task.customer.fantasyName || observation.task.customer.corporateName}
                  </ThemedText>
                </View>
              )}

              {/* Sector */}
              {observation.task.sector && (
                <View style={[styles.detailRow, { backgroundColor: colors.muted }]}>
                  <View style={styles.detailLabelContainer}>
                    <IconBuildingFactory size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Setor
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {observation.task.sector.name}
                  </ThemedText>
                </View>
              )}
            </View>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionWithBorder: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  subsectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  descriptionBox: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  detailsContainer: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    flex: 1,
  },
});
