import { View, StyleSheet } from "react-native";
import {
  IconCurrencyReal,
  IconCalculator,
  IconBuildingBank,
  IconAlertTriangle,
  IconClockExclamation,
} from "@tabler/icons-react-native";
import { ThemedText, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { formatCurrency } from "@/utils";
import { spacing, fontSize } from "@/constants/design-system";
import type { CompletePayrollCalculation } from "@/types/payroll";

interface HoleriteBreakdownCardProps {
  calculation: CompletePayrollCalculation;
}

interface BreakdownLine {
  label: string;
  amount: number;
  hint?: string;
}

/**
 * Full holerite (contracheque) breakdown rendered from the live/saved
 * CompletePayrollCalculation result — the RN mirror of the web
 * holerite-breakdown-card. Surfaces every legal provento and desconto the
 * Área Andressa payroll calculator now produces:
 *  - salário-família / insalubridade / periculosidade
 *  - justified vs unjustified absence split (atestado ≠ perda de salário)
 *  - calculator warnings (margem consignável 35% clamp, líquido pisado em zero)
 *  - prorationFactor (avos) for mid-month admission/termination
 *
 * NOTE: habitualGratification is intentionally NOT rendered — the habitual
 * gratification feed was removed from the pipeline.
 */
export function HoleriteBreakdownCard({ calculation }: HoleriteBreakdownCardProps) {
  const { colors } = useTheme();

  const {
    baseSalary,
    overtimeEarnings,
    dsrEarnings,
    bonusAmount,
    additionalEarnings,
    otherEarnings,
    grossSalary,
    taxDeductions,
    absenceDeductions,
    benefitDeductions,
    benefitCopayItems,
    legalDeductions,
    loanDeductions,
    customDeductions,
    totalDeductions,
    netSalary,
    employerContributions,
    prorationFactor,
    workingDaysInMonth,
    workedDays,
    warnings,
  } = calculation;

  const isProrated = prorationFactor != null && prorationFactor < 1;
  const prorationPct = isProrated ? Math.round(prorationFactor * 100) : 100;

  // ===== Build provento (earning) lines, skipping zeros =====
  const earningLines: BreakdownLine[] = [];
  const pushEarning = (label: string, amount?: number, hint?: string) => {
    if (amount && amount > 0) earningLines.push({ label, amount, hint });
  };

  pushEarning("Salário Base", baseSalary, isProrated ? `pró-rata · ${prorationPct}% do mês` : undefined);
  pushEarning(
    "Horas Extras 50%",
    overtimeEarnings?.overtime50Amount,
    overtimeEarnings?.overtime50Hours ? `${overtimeEarnings.overtime50Hours.toFixed(2)}h` : undefined,
  );
  pushEarning(
    "Horas Extras 100%",
    overtimeEarnings?.overtime100Amount,
    overtimeEarnings?.overtime100Hours ? `${overtimeEarnings.overtime100Hours.toFixed(2)}h` : undefined,
  );
  pushEarning(
    "Adicional Noturno",
    overtimeEarnings?.nightDifferentialAmount,
    overtimeEarnings?.nightHours ? `${overtimeEarnings.nightHours.toFixed(2)}h × 20%` : undefined,
  );
  pushEarning("DSR sobre Horas Extras", dsrEarnings?.dsrOnOvertime);
  pushEarning("DSR sobre Bonificações", dsrEarnings?.dsrOnBonifications);
  pushEarning("Bonificação", bonusAmount);

  // ---- New legal earnings (Área Andressa pipeline) ----
  pushEarning(
    "Salário-família",
    additionalEarnings?.familyAllowance,
    additionalEarnings?.eligibleChildren
      ? `${additionalEarnings.eligibleChildren} cota(s) × ${formatCurrency(additionalEarnings.familyAllowanceQuota || 0)}`
      : undefined,
  );
  pushEarning(
    "Adicional de Insalubridade",
    additionalEarnings?.insalubrity,
    additionalEarnings?.insalubrityPercent
      ? `${additionalEarnings.insalubrityPercent}% do salário-mínimo`
      : undefined,
  );
  pushEarning("Adicional de Periculosidade", additionalEarnings?.hazardPay, "30% do salário-base");
  pushEarning("Outros Proventos", otherEarnings);

  // ===== Build desconto (deduction) groups, skipping zeros =====
  const pushLine = (arr: BreakdownLine[], label: string, amount?: number, hint?: string) => {
    if (amount && amount > 0) arr.push({ label, amount, hint });
  };

  const taxLines: BreakdownLine[] = [];
  if (taxDeductions?.inssAmount > 0) {
    taxLines.push({
      label: "INSS",
      amount: taxDeductions.inssAmount,
      hint: `base ${formatCurrency(taxDeductions.inssBase || 0)} · ${(taxDeductions.inssEffectiveRate || 0).toFixed(2)}%`,
    });
  }
  if (taxDeductions?.irrfAmount > 0) {
    taxLines.push({
      label: "IRRF",
      amount: taxDeductions.irrfAmount,
      hint: `base ${formatCurrency(taxDeductions.irrfBase || 0)} · ${(taxDeductions.irrfEffectiveRate || 0).toFixed(2)}%`,
    });
  }

  const absenceLines: BreakdownLine[] = [];
  if (absenceDeductions?.absenceAmount > 0) {
    const parts: string[] = [];
    if (absenceDeductions.unjustifiedAbsenceDays > 0) {
      parts.push(`${absenceDeductions.unjustifiedAbsenceDays} dia(s) injustificada(s)`);
    }
    if (absenceDeductions.justifiedAbsenceDays > 0) {
      parts.push(`${absenceDeductions.justifiedAbsenceDays} justificada(s) — sem desconto`);
    }
    absenceLines.push({
      label: "Faltas",
      amount: absenceDeductions.absenceAmount,
      hint: parts.join(" · ") || undefined,
    });
  }
  if (absenceDeductions?.absenceDsrLoss > 0) {
    absenceLines.push({ label: "Perda de DSR (faltas)", amount: absenceDeductions.absenceDsrLoss });
  }
  if (absenceDeductions?.lateArrivalAmount > 0) {
    absenceLines.push({
      label: "Atrasos",
      amount: absenceDeductions.lateArrivalAmount,
      hint: absenceDeductions.lateArrivalMinutes ? `${absenceDeductions.lateArrivalMinutes} min` : undefined,
    });
  }

  const benefitLines: BreakdownLine[] = [];
  pushLine(benefitLines, "Vale Alimentação", benefitDeductions?.mealVoucher);
  pushLine(benefitLines, "Vale Transporte", benefitDeductions?.transportVoucher);
  pushLine(benefitLines, "Plano de Saúde", benefitDeductions?.healthInsurance, "dedutível do IRRF");
  pushLine(benefitLines, "Plano Odontológico", benefitDeductions?.dentalInsurance);
  pushLine(benefitLines, "Outros Benefícios", benefitDeductions?.otherBenefits);
  (benefitCopayItems || []).forEach((item) => {
    pushLine(benefitLines, item.benefitName || "Benefício", item.amount);
  });

  const legalLines: BreakdownLine[] = [];
  pushLine(legalLines, "Contribuição Sindical", legalDeductions?.unionContribution);
  pushLine(legalLines, "Pensão Alimentícia", legalDeductions?.alimony, "deduzida da base de IRRF");
  pushLine(legalLines, "Penhora", legalDeductions?.garnishment);

  const loanLines: BreakdownLine[] = [];
  pushLine(loanLines, "Empréstimos Consignados", loanDeductions?.loans);
  pushLine(loanLines, "Adiantamentos", loanDeductions?.advances);
  pushLine(loanLines, "Descontos Diversos", customDeductions);

  const deductionGroups: Array<{ title: string; lines: BreakdownLine[] }> = [
    { title: "Impostos", lines: taxLines },
    { title: "Faltas/Atrasos", lines: absenceLines },
    { title: "Benefícios", lines: benefitLines },
    { title: "Descontos Legais", lines: legalLines },
    { title: "Empréstimos/Adiantamentos", lines: loanLines },
  ].filter((g) => g.lines.length > 0);

  const netFlooredAtZero = netSalary === 0 && totalDeductions > 0;

  return (
    <View style={{ gap: spacing.md }}>
      {/* Calculator warnings — surfaced prominently above the breakdown. */}
      {warnings && warnings.length > 0 && (
        <View style={[styles.banner, { backgroundColor: colors.warning + "1A", borderColor: colors.warning }]}>
          <IconAlertTriangle size={20} color={colors.warning} />
          <View style={styles.bannerBody}>
            <ThemedText style={[styles.bannerTitle, { color: colors.warning }]}>Avisos do cálculo</ThemedText>
            {warnings.map((w, i) => (
              <ThemedText key={i} style={[styles.bannerText, { color: colors.warning }]}>
                {"•"} {w}
              </ThemedText>
            ))}
          </View>
        </View>
      )}

      {/* Proration banner for mid-month admission/termination. */}
      {isProrated && (
        <View style={[styles.banner, { backgroundColor: colors.primary + "14", borderColor: colors.primary }]}>
          <IconClockExclamation size={20} color={colors.primary} />
          <View style={styles.bannerBody}>
            <ThemedText style={[styles.bannerTitle, { color: colors.primary }]}>
              Cálculo proporcional (avos) — {prorationPct}% do mês
            </ThemedText>
            <ThemedText style={[styles.bannerText, { color: colors.mutedForeground }]}>
              {workedDays} de {workingDaysInMonth} dias · salário-base, salário-família e adicionais reduzidos
              proporcionalmente (admissão/desligamento no meio do mês).
            </ThemedText>
          </View>
        </View>
      )}

      {/* PROVENTOS */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <IconCurrencyReal size={18} color={colors.success} />
            <CardTitle>Proventos (Ganhos)</CardTitle>
            {isProrated && (
              <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                <ThemedText style={[styles.badgeText, { color: colors.mutedForeground }]}>
                  Proporcional {prorationPct}%
                </ThemedText>
              </View>
            )}
          </View>
        </CardHeader>
        <CardContent>
          {earningLines.map((line, i) => (
            <View key={i} style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <ThemedText style={[styles.lineLabel, { color: colors.mutedForeground }]}>{line.label}</ThemedText>
                {!!line.hint && (
                  <ThemedText style={[styles.lineHint, { color: colors.mutedForeground }]}>{line.hint}</ThemedText>
                )}
              </View>
              <ThemedText style={[styles.lineValue, { color: colors.success }]}>
                {formatCurrency(line.amount)}
              </ThemedText>
            </View>
          ))}
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.lineRow}>
            <ThemedText style={styles.totalLabel}>Salário Bruto</ThemedText>
            <ThemedText style={[styles.totalValue, { color: colors.success }]}>
              {formatCurrency(grossSalary || 0)}
            </ThemedText>
          </View>
        </CardContent>
      </Card>

      {/* DESCONTOS */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <IconCalculator size={18} color={colors.destructive} />
            <CardTitle>Descontos</CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          {deductionGroups.map((group) => (
            <View key={group.title} style={styles.group}>
              <ThemedText style={[styles.groupTitle, { color: colors.mutedForeground }]}>
                {group.title.toUpperCase()}
              </ThemedText>
              {group.lines.map((line, i) => (
                <View key={i} style={styles.lineRow}>
                  <View style={styles.lineLabelCol}>
                    <ThemedText style={[styles.lineLabel, { color: colors.mutedForeground }]}>{line.label}</ThemedText>
                    {!!line.hint && (
                      <ThemedText style={[styles.lineHint, { color: colors.mutedForeground }]}>{line.hint}</ThemedText>
                    )}
                  </View>
                  <ThemedText style={[styles.lineValue, { color: colors.destructive }]}>
                    -{formatCurrency(line.amount)}
                  </ThemedText>
                </View>
              ))}
            </View>
          ))}

          {deductionGroups.length === 0 && (
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhum desconto aplicado
            </ThemedText>
          )}

          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.lineRow}>
            <ThemedText style={styles.totalLabel}>Total Descontos</ThemedText>
            <ThemedText style={[styles.totalValue, { color: colors.destructive }]}>
              -{formatCurrency(totalDeductions || 0)}
            </ThemedText>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.lineRow}>
            <ThemedText style={styles.netLabel}>Salário Líquido</ThemedText>
            <ThemedText style={[styles.netValue, { color: colors.primary }]}>
              {formatCurrency(netSalary || 0)}
            </ThemedText>
          </View>
          {netFlooredAtZero && (
            <ThemedText style={[styles.lineHint, { color: colors.warning }]}>
              Líquido pisado em zero — descontos limitados ao salário bruto.
            </ThemedText>
          )}

          {employerContributions?.fgtsAmount > 0 && (
            <View style={[styles.fgtsBox, { backgroundColor: colors.muted }]}>
              <IconBuildingBank size={16} color={colors.mutedForeground} />
              <View style={styles.fgtsBody}>
                <ThemedText style={styles.fgtsTitle}>FGTS (Depósito do Empregador)</ThemedText>
                <ThemedText style={[styles.fgtsText, { color: colors.mutedForeground }]}>
                  Valor depositado: {formatCurrency(employerContributions.fgtsAmount)}
                  {employerContributions.fgtsRate
                    ? ` (${(employerContributions.fgtsRate * 100).toFixed(0)}%)`
                    : ""}
                </ThemedText>
                <ThemedText style={[styles.fgtsText, styles.fgtsItalic, { color: colors.mutedForeground }]}>
                  * Não descontado do salário do funcionário
                </ThemedText>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  banner: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  bannerBody: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  bannerText: {
    fontSize: fontSize.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  group: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  groupTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    marginBottom: 2,
  },
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  lineLabelCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  lineLabel: {
    fontSize: fontSize.sm,
  },
  lineHint: {
    fontSize: fontSize.xs,
    opacity: 0.8,
    marginTop: 1,
  },
  lineValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  separator: {
    height: 1,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  netLabel: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  netValue: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  fgtsBox: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    marginTop: spacing.sm,
    alignItems: "flex-start",
  },
  fgtsBody: {
    flex: 1,
    gap: 2,
  },
  fgtsTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  fgtsText: {
    fontSize: fontSize.xs,
  },
  fgtsItalic: {
    fontStyle: "italic",
    marginTop: 2,
  },
});
