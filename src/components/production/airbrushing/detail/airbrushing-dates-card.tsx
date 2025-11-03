
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendar, IconCurrencyDollar } from "@tabler/icons-react-native";
import { formatDate, formatCurrency } from '@/utils';

interface AirbrushingDatesCardProps {
  airbrushing: any;
}

export function AirbrushingDatesCard({ airbrushing }: AirbrushingDatesCardProps) {
  const { colors } = useTheme();

  const hasDateInfo = airbrushing.startDate || airbrushing.finishDate || airbrushing.price;

  if (!hasDateInfo) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconCalendar size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Datas e Valores</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconCalendar size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhuma informação de datas
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Este airbrushing não possui datas ou valores cadastrados.
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
          <IconCalendar size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Datas e Valores</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Dates Section */}
          {(airbrushing.startDate || airbrushing.finishDate) && (
            <View style={styles.section}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                Datas
              </ThemedText>
              <View style={styles.fieldsContainer}>
                {/* Start Date */}
                {airbrushing.startDate && (
                  <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Data de Início
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                      {formatDate(airbrushing.startDate)}
                    </ThemedText>
                  </View>
                )}

                {/* Finish Date */}
                {airbrushing.finishDate && (
                  <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Data de Finalização
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                      {formatDate(airbrushing.finishDate)}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Price Section */}
          {airbrushing.price && (
            <View style={StyleSheet.flatten([
              styles.section,
              (airbrushing.startDate || airbrushing.finishDate) && styles.priceSection,
              { borderTopColor: colors.border + "50" }
            ])}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                Valores
              </ThemedText>
              <View style={styles.fieldsContainer}>
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Preço do Airbrushing
                  </ThemedText>
                  <View style={styles.priceContainer}>
                    <IconCurrencyDollar size={16} color={colors.success} />
                    <ThemedText style={StyleSheet.flatten([styles.priceValue, { color: colors.success }])}>
                      {formatCurrency(airbrushing.price)}
                    </ThemedText>
                  </View>
                </View>
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
  priceSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
