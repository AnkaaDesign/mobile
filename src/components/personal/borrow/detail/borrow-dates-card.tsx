import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { Borrow } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BorrowDatesCardProps {
  borrow: Borrow;
}

export function BorrowDatesCard({ borrow }: BorrowDatesCardProps) {
  const { colors } = useTheme();

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Não definido";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <DetailCard title="Datas" icon="calendar">
      <View style={styles.content}>
        <DetailField
          label="Data do Empréstimo"
          value={formatDate(borrow.createdAt)}
          icon="calendar"
        />

        {borrow.returnedAt && (
          <DetailField
            label="Data de Devolução"
            value={formatDate(borrow.returnedAt)}
            icon="calendar-check"
            iconColor="#15803d"
          />
        )}

        {borrow.returnedAt && borrow.createdAt && (
          <DetailSection title="Duração do Empréstimo">
            <ThemedText style={StyleSheet.flatten([styles.durationText, { color: colors.mutedForeground }])}>
              {(() => {
                const start = new Date(borrow.createdAt);
                const end = new Date(borrow.returnedAt);
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
              })()}
            </ThemedText>
          </DetailSection>
        )}

        {borrow.updatedAt && (
          <View style={StyleSheet.flatten([styles.metaInfo, { borderTopColor: colors.border + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.metaLabel, { color: colors.mutedForeground }])}>
              Última atualização: {formatDate(borrow.updatedAt)}
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  durationText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  metaInfo: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
