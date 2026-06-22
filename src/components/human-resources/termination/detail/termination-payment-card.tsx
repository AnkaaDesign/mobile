import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import type { Termination } from "@/types";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/number";
import { isPaymentOverdue } from "./termination-utils";

interface Props {
  termination: Termination;
}

/**
 * Pagamento (read-only). Mirror da seção 4 do detalhe web (PaymentCard):
 * alerta destrutivo CLT 477 quando em atraso, Prazo de Pagamento, Data de
 * Pagamento e Valor Pago. A edição (form) está fora do escopo do mobile.
 */
export function TerminationPaymentCard({ termination: t }: Props) {
  const { colors } = useTheme();
  const overdue = isPaymentOverdue(t);

  return (
    <DetailCard title="Pagamento" icon="coins">
      <View style={styles.content}>
        {overdue ? (
          <Alert variant="destructive">
            <AlertTitle>Pagamento em atraso</AlertTitle>
            <AlertDescription>
              O prazo de 10 dias corridos (CLT 477 §6º) foi ultrapassado. O atraso sujeita a
              empresa à multa do art. 477 §8º: multa administrativa por trabalhador + multa em
              favor do colaborador no valor equivalente ao seu salário.
            </AlertDescription>
          </Alert>
        ) : null}

        <DetailField
          label="Prazo de Pagamento (CLT 477 §6º)"
          value={
            t.paymentDueDate ? (
              <View style={styles.inlineRow}>
                <ThemedText
                  style={{ color: overdue ? colors.destructive : colors.foreground, fontWeight: "500" }}
                >
                  {formatDate(t.paymentDueDate)}
                </ThemedText>
                {overdue ? (
                  <Badge variant="destructive" size="sm">
                    <ThemedText style={{ fontSize: 10, color: "#fff" }}>Atrasado</ThemedText>
                  </Badge>
                ) : null}
              </View>
            ) : (
              "—"
            )
          }
        />

        <DetailField label="Data de Pagamento" value={formatDate(t.paymentDate)} />
        <DetailField
          label="Valor Pago"
          value={t.paidAmount != null ? formatCurrency(t.paidAmount) : "—"}
        />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
