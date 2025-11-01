
import { View, StyleSheet } from "react-native";
import type { Holiday } from '../../../../types';
import { HOLIDAY_TYPE_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconCalendar, IconMapPin } from "@tabler/icons-react-native";

interface HolidayCardProps {
  holiday: Holiday;
}

export function HolidayCard({ holiday }: HolidayCardProps) {
  const { colors } = useTheme();

  // Get badge variant based on holiday type
  const getTypeBadgeVariant = () => {
    switch (holiday.type) {
      case "NATIONAL":
        return "destructive";
      case "STATE":
        return "warning";
      case "MUNICIPAL":
        return "info";
      case "OPTIONAL":
        return "secondary";
      default:
        return "default";
    }
  };

  // Format the date with day of week
  const formatDateWithDay = (date: Date) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
    const formattedDate = formatDate(date);
    return `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, ${formattedDate}`;
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconCalendar size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações do Feriado</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Holiday Name */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Nome</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>{holiday.name}</ThemedText>
          </View>

          {/* Holiday Date */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Data</ThemedText>
            <View style={styles.dateContainer}>
              <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>{formatDateWithDay(holiday.date)}</ThemedText>
            </View>
          </View>

          {/* Holiday Type */}
          {holiday.type && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Tipo</ThemedText>
              <Badge variant={getTypeBadgeVariant()}>
                <View style={styles.badgeContent}>
                  <IconMapPin size={14} color={colors.primaryForeground} />
                  <ThemedText style={styles.badgeText}>{HOLIDAY_TYPE_LABELS[holiday.type]}</ThemedText>
                </View>
              </Badge>
            </View>
          )}

          {/* Days Until/Since */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Status</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
              {new Date(holiday.date) > new Date()
                ? `Falta${Math.ceil((new Date(holiday.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias`
                : new Date(holiday.date).toDateString() === new Date().toDateString()
                  ? "Hoje"
                  : `Há ${Math.floor((new Date().getTime() - new Date(holiday.date).getTime()) / (1000 * 60 * 60 * 24))} dias`}
            </ThemedText>
          </View>
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
  content: {
    gap: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 2,
    textAlign: "right",
  },
  dateContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
});
