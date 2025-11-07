
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconCalendar } from "@tabler/icons-react-native";
import { formatDate, formatRelativeTime } from "@/utils";

interface ObservationMetadataCardProps {
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function ObservationMetadataCard({ createdAt, updatedAt }: ObservationMetadataCardProps) {
  const { colors } = useTheme();

  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);
  const hasBeenUpdated = createdDate.getTime() !== updatedDate.getTime();

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <IconCalendar size={20} color={colors.primary} />
        <ThemedText style={styles.sectionTitle}>Metadados</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.datesContainer}>
          {/* Created At */}
          <View style={[styles.dateRow, { backgroundColor: colors.muted }]}>
            <View style={styles.dateLabelContainer}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                Criada em
              </ThemedText>
            </View>
            <View style={styles.dateValueContainer}>
              <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
                {formatDate(createdDate)}
              </ThemedText>
              <ThemedText style={[styles.dateRelative, { color: colors.mutedForeground }]}>
                {formatRelativeTime(createdDate)}
              </ThemedText>
            </View>
          </View>

          {/* Updated At */}
          {hasBeenUpdated && (
            <View style={[styles.dateRow, { backgroundColor: colors.muted }]}>
              <View style={styles.dateLabelContainer}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                  Atualizada em
                </ThemedText>
              </View>
              <View style={styles.dateValueContainer}>
                <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
                  {formatDate(updatedDate)}
                </ThemedText>
                <ThemedText style={[styles.dateRelative, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(updatedDate)}
                </ThemedText>
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
    padding: 0,
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
    padding: spacing.md,
  },
  datesContainer: {
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  dateLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateValueContainer: {
    alignItems: "flex-end",
  },
  dateValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  dateRelative: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
