import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { spacing } from "@/constants/design-system";
import type { Borrow } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BorrowDatesCardProps {
  borrow: Borrow;
}

export function BorrowDatesCard({ borrow }: BorrowDatesCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Não definido";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const formatDuration = (start: Date | string, end: Date | string) => {
    const startObj = typeof start === "string" ? new Date(start) : start;
    const endObj = typeof end === "string" ? new Date(end) : end;
    const diffTime = endObj.getTime() - startObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
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
          <DetailField
            label="Duração do Empréstimo"
            value={formatDuration(borrow.createdAt, borrow.returnedAt)}
            icon="clock"
          />
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
});
