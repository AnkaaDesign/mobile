import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconReceipt, IconCalculator, IconPrinter } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils/formatters";
import type { Vacation, VacationRecibo } from "@/types";
import { useVacationCalculate } from "@/hooks/useVacation";
import { exportVacationReciboPdf } from "@/utils/vacation-recibo-pdf-generator";

interface VacationReciboCardProps {
  vacation: Vacation;
}

function Line({ label, amount, negative }: { label: string; amount: number; negative?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.line, { borderBottomColor: colors.border }]}>
      <ThemedText style={[styles.lineLabel, { color: colors.mutedForeground }]}>{label}</ThemedText>
      <ThemedText style={[styles.lineValue, negative && { color: colors.destructive }]}>
        {negative ? "- " : ""}
        {formatCurrency(amount)}
      </ThemedText>
    </View>
  );
}

/**
 * "Recibo de Férias" — mirrors web's VacationReciboCard. Calculate fires
 * POST /vacations/:id/calculate (férias + 1/3 + abono − INSS/IRRF), then the
 * Imprimir button renders a PDF and opens the OS share sheet (print / WhatsApp).
 */
export function VacationReciboCard({ vacation }: VacationReciboCardProps) {
  const { colors } = useTheme();
  const calculate = useVacationCalculate();
  const [recibo, setRecibo] = useState<VacationRecibo | null>(null);

  const handleCalculate = async () => {
    try {
      const result = await calculate.mutateAsync(vacation.id);
      const data = (result as any)?.data?.recibo;
      if (data) setRecibo(data);
    } catch {
      // api-client surfaces the error toast.
    }
  };

  const handlePrint = async () => {
    if (!recibo) return;
    await exportVacationReciboPdf({
      recibo,
      employeeName: vacation.user?.name ?? "Colaborador",
      position: vacation.user?.position?.name,
      sector: vacation.user?.sector?.name,
      acquisitiveStart: vacation.acquisitiveStart,
      acquisitiveEnd: vacation.acquisitiveEnd,
      concessiveEnd: vacation.concessiveEnd,
      paymentDate: vacation.paymentDate,
    });
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconReceipt size={20} color={colors.primary} />
          <ThemedText style={styles.title}>Recibo de Férias</ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          loading={calculate.isPending}
          icon={<IconCalculator size={16} color={colors.foreground} />}
          onPress={handleCalculate}
          style={styles.actionButton}
        >
          {recibo ? "Recalcular" : "Calcular"}
        </Button>
        {recibo ? (
          <Button
            variant="default"
            size="sm"
            icon={<IconPrinter size={16} color={colors.primaryForeground} />}
            onPress={handlePrint}
            style={styles.actionButton}
          >
            Imprimir
          </Button>
        ) : null}
      </View>

      {!recibo ? (
        <ThemedText style={[styles.hint, { color: colors.mutedForeground }]}>
          Toque em Calcular para gerar o recibo de férias (férias + 1/3 + abono − INSS/IRRF), pagável separadamente da folha mensal.
        </ThemedText>
      ) : (
        <View style={styles.content}>
          {recibo.isDouble ? (
            <View style={[styles.alert, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}>
              <ThemedText style={[styles.alertText, { color: colors.destructive }]}>
                Férias em dobro (art. 137): o período concessivo expirou — os valores foram dobrados.
              </ThemedText>
            </View>
          ) : null}

          <View>
            {recibo.lines && recibo.lines.length > 0 ? (
              recibo.lines.map((line, i) => (
                <Line key={i} label={line.label} amount={Math.abs(line.amount)} negative={line.amount < 0} />
              ))
            ) : (
              <>
                <Line label={`Férias (${recibo.vacationDays} dias)`} amount={recibo.baseRemuneration} />
                <Line label="1/3 Constitucional" amount={recibo.oneThird} />
                {recibo.abonoPecuniarioDays > 0 ? (
                  <Line label={`Abono Pecuniário (${recibo.abonoPecuniarioDays} dias)`} amount={recibo.abonoAmount} />
                ) : null}
                {recibo.abonoOneThird > 0 ? <Line label="1/3 sobre Abono" amount={recibo.abonoOneThird} /> : null}
                {recibo.inss > 0 ? <Line label="INSS" amount={recibo.inss} negative /> : null}
                {recibo.irrf > 0 ? <Line label="IRRF" amount={recibo.irrf} negative /> : null}
              </>
            )}
          </View>

          <View style={[styles.totals, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total de Proventos</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrency(recibo.earnings)}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total de Descontos</ThemedText>
              <ThemedText style={[styles.totalValue, { color: colors.destructive }]}>- {formatCurrency(recibo.discounts)}</ThemedText>
            </View>
            <View style={[styles.netRow, { borderTopColor: colors.border }]}>
              <ThemedText style={styles.netLabel}>Líquido a Receber</ThemedText>
              <View style={styles.netValueWrap}>
                <ThemedText style={styles.netValue}>{formatCurrency(recibo.net)}</ThemedText>
                {recibo.isDouble ? <Badge variant="expired">Dobro</Badge> : null}
              </View>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.medium },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionButton: { flex: 1 },
  hint: { fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5 },
  content: { gap: spacing.md },
  alert: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  alertText: { fontSize: fontSize.sm },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lineLabel: { fontSize: fontSize.sm, flexShrink: 1, marginRight: spacing.md },
  lineValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  totals: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: fontSize.sm },
  totalValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
  },
  netLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  netValueWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  netValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
