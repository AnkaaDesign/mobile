import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { Holiday } from '../../../../types';
import { formatDate } from "@/utils";
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
    <DetailCard title="Informações do Feriado" icon="calendar">
      <View style={styles.content}>
        <DetailSection title="Identificação">
          <DetailField label="Nome" value={holiday.name} />
        </DetailSection>

        <DetailSection title="Data">
          <DetailField label="Data" value={formatDate(new Date(holiday.date))} icon="calendar" />
          <DetailField label="Dia da Semana" value={getDayOfWeek(holiday.date)} />
          <DetailField label="Status" value={daysUntil} />
        </DetailSection>

        {holiday.type && (
          <DetailSection title="Tipo">
            <DetailField
              label="Abrangência"
              icon="map-pin"
              value={
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
              }
            />
          </DetailSection>
        )}

        <DetailSection title="Informações do Sistema">
          {holiday.createdAt && (
            <DetailField label="Cadastrado Em" value={formatDate(new Date(holiday.createdAt))} />
          )}
          {holiday.updatedAt && (
            <DetailField label="Atualizado Em" value={formatDate(new Date(holiday.updatedAt))} />
          )}
        </DetailSection>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
});
