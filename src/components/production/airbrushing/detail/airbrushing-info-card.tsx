
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBrush } from "@tabler/icons-react-native";
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from '@/constants';
import { getBadgeVariantFromStatus } from "@/components/ui/badge";

interface AirbrushingInfoCardProps {
  airbrushing: any;
}

export function AirbrushingInfoCard({ airbrushing }: AirbrushingInfoCardProps) {
  const { colors } = useTheme();

  const statusBadgeVariant = getBadgeVariantFromStatus(airbrushing.status, "AIRBRUSHING_STATUS");

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBrush size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Airbrushing</ThemedText>
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

          {/* Paints Section */}
          {(airbrushing.task?.logoPaints?.length || airbrushing.task?.generalPainting) && (
            <View style={StyleSheet.flatten([styles.section, styles.paintsSection, { borderTopColor: colors.border + "50" }])}>
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
                      Tintas da Logomarca ({airbrushing.task.logoPaints?.length ?? 0}):
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
});
