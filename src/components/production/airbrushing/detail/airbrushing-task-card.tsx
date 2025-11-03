
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBrush } from "@tabler/icons-react-native";
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from '@/constants';
import { getBadgeVariantFromStatus } from "@/components/ui/badge";

interface AirbrushingTaskCardProps {
  airbrushing: any;
}

export function AirbrushingTaskCard({ airbrushing }: AirbrushingTaskCardProps) {
  const { colors } = useTheme();

  const statusBadgeVariant = getBadgeVariantFromStatus(airbrushing.status, "AIRBRUSHING_STATUS");

  if (!airbrushing.task) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações da Aerografia</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.infoContainer}>
            {/* Status Section */}
            <View style={styles.section}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                Status
              </ThemedText>
              <View style={styles.fieldsContainer}>
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Status Atual
                  </ThemedText>
                  <Badge variant={statusBadgeVariant}>
                    {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
                  </Badge>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconBrush size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhuma tarefa vinculada
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Este airbrushing não possui uma tarefa vinculada.
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBrush size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações da Aerografia</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Status Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Status
            </ThemedText>
            <View style={styles.fieldsContainer}>
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Status Atual
                </ThemedText>
                <Badge variant={statusBadgeVariant}>
                  {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
                </Badge>
              </View>
            </View>
          </View>

          {/* Task Details Section */}
          <View style={[styles.section, styles.taskSection, { borderTopColor: colors.border + "50" }]}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Detalhes da Tarefa
            </ThemedText>
            <View style={styles.fieldsContainer}>
              {/* Task Name */}
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Nome da Tarefa
                </ThemedText>
                <ThemedText
                  style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {airbrushing.task.name}
                </ThemedText>
              </View>

              {/* Customer */}
              {airbrushing.task.customer && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Cliente
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {airbrushing.task.customer.fantasyName}
                  </ThemedText>
                </View>
              )}

              {/* Truck */}
              {airbrushing.task.truck && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Veículo
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {airbrushing.task.truck.model} - {airbrushing.task.truck.plate}
                  </ThemedText>
                </View>
              )}

              {/* Serial Number */}
              {airbrushing.task.serialNumber && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Número de Série
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {airbrushing.task.serialNumber}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Paints Section */}
          {(airbrushing.task.logoPaints?.length || airbrushing.task.generalPainting) && (
            <View style={[styles.section, styles.paintsSection, { borderTopColor: colors.border + "50" }]}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                Tintas Utilizadas
              </ThemedText>
              <View style={styles.paintsContainer}>
                {(airbrushing.task.generalPainting as any)?.paint && (
                  <View style={styles.paintItem}>
                    <ThemedText style={StyleSheet.flatten([styles.paintLabel, { color: colors.mutedForeground }])}>
                      Tinta Geral:
                    </ThemedText>
                    <Badge variant="secondary">
                      {(airbrushing.task.generalPainting as any)?.paint?.name}
                    </Badge>
                  </View>
                )}

                {(airbrushing.task.logoPaints?.length ?? 0) > 0 && (
                  <View style={styles.paintItem}>
                    <ThemedText style={StyleSheet.flatten([styles.paintLabel, { color: colors.mutedForeground }])}>
                      Tintas do Logo ({airbrushing.task.logoPaints?.length ?? 0}):
                    </ThemedText>
                    <View style={styles.badgesContainer}>
                      {airbrushing.task.logoPaints?.map((logoPaint: any) => (
                        <Badge key={logoPaint.id} variant="outline">
                          {(logoPaint as any)?.paint?.name || "Tinta sem nome"}
                        </Badge>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
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
    gap: spacing.sm,
  },
  infoContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  taskSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  paintsSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  paintsContainer: {
    gap: spacing.md,
  },
  paintItem: {
    gap: spacing.sm,
  },
  paintLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
