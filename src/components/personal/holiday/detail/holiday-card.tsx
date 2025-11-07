import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendar, IconMapPin } from "@tabler/icons-react-native";
import type { Holiday } from '../../../../types';
import { formatDate } from '../../../../utils';
import { HOLIDAY_TYPE_LABELS } from '@/constants/enum-labels';
import { HOLIDAY_TYPE } from '@/constants/enums';
import { badgeColors } from "@/lib/theme/extended-colors";

interface HolidayCardProps {
  holiday: Holiday;
}

// Helper function to get day of week
const getDayOfWeek = (date: Date): string => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date(date).getDay()];
};

// Helper function to calculate days until holiday
const getDaysUntil = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);

  const diffTime = holidayDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Passado";
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays < 7) return `Em ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Em 1 semana" : `Em ${weeks} semanas`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Em 1 mês" : `Em ${months} meses`;
};

export function HolidayCard({ holiday }: HolidayCardProps) {
  const { colors } = useTheme();

  const getTypeColor = (type: HOLIDAY_TYPE) => {
    switch (type) {
      case HOLIDAY_TYPE.NATIONAL:
        return { bg: badgeColors.info.background, text: badgeColors.info.text };
      case HOLIDAY_TYPE.STATE:
        return { bg: badgeColors.success.background, text: badgeColors.success.text };
      case HOLIDAY_TYPE.MUNICIPAL:
        return { bg: badgeColors.warning.background, text: badgeColors.warning.text };
      case HOLIDAY_TYPE.OPTIONAL:
        return { bg: badgeColors.muted.background, text: badgeColors.muted.text };
      default:
        return { bg: badgeColors.muted.background, text: badgeColors.muted.text };
    }
  };

  const typeColors = holiday.type ? getTypeColor(holiday.type) : null;
  const daysUntil = getDaysUntil(holiday.date);

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconCalendar size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Feriado</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Holiday Name */}
        <View style={styles.section}>
          <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
            Identificação
          </ThemedText>
          <View style={styles.fieldsContainer}>
            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                Nome
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {holiday.name}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Date Information */}
        <View style={styles.section}>
          <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
            Data
          </ThemedText>
          <View style={styles.fieldsContainer}>
            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <View style={styles.fieldLabelWithIcon}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Data
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {formatDate(new Date(holiday.date))}
              </ThemedText>
            </View>

            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                Dia da Semana
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {getDayOfWeek(holiday.date)}
              </ThemedText>
            </View>

            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                Status
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {daysUntil}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Type */}
        {holiday.type && (
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Tipo
            </ThemedText>
            <View style={styles.fieldsContainer}>
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.fieldLabelWithIcon}>
                  <IconMapPin size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Abrangência
                  </ThemedText>
                </View>
                <Badge
                  variant="secondary"
                  size="sm"
                  style={{
                    backgroundColor: typeColors?.bg,
                    borderWidth: 0,
                  }}
                >
                  <ThemedText
                    style={{
                      color: typeColors?.text,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.medium,
                    }}
                  >
                    {HOLIDAY_TYPE_LABELS[holiday.type]}
                  </ThemedText>
                </Badge>
              </View>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
            Informações do Sistema
          </ThemedText>
          <View style={styles.fieldsContainer}>
            {holiday.createdAt && (
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Cadastrado Em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                  {formatDate(new Date(holiday.createdAt))}
                </ThemedText>
              </View>
            )}

            {holiday.updatedAt && (
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Atualizado Em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                  {formatDate(new Date(holiday.updatedAt))}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  fieldsContainer: {
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
    marginLeft: spacing.md,
  },
});
