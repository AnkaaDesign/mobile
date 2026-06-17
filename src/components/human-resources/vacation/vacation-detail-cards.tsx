import React from "react";
import { View, StyleSheet } from "react-native";
import {
  IconCalendar,
  IconCalendarStats,
  IconAlertTriangle,
  IconCalendarTime,
} from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { VACATION_STATUS_LABELS } from "@/constants/enum-labels";
import type { Vacation } from "@/types";
import {
  concessiveExpiryLevel,
  daysUntilConcessiveEnd,
  vacationStatusVariant,
} from "./vacation-utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
}

/** Concessivo-expiry alert badge (expiring/expired). Renders nothing when ok. */
export function VacationExpiryBadge({ vacation }: { vacation: Vacation }) {
  const level = concessiveExpiryLevel({ concessiveEnd: vacation.concessiveEnd, status: vacation.status });
  if (level === null || level === "ok") return null;
  const days = daysUntilConcessiveEnd(vacation.concessiveEnd);
  if (level === "expired") {
    return (
      <Badge variant="expired">
        {vacation.isDouble ? "Concessivo vencido — férias em dobro" : "Concessivo vencido"}
      </Badge>
    );
  }
  return <Badge variant="onHold">{`Concessivo vence em ${days} dia${days === 1 ? "" : "s"}`}</Badge>;
}

export function VacationStatusCard({ vacation }: { vacation: Vacation }) {
  return (
    <Card style={styles.card}>
      <View style={styles.statusRow}>
        <Badge variant={vacationStatusVariant(vacation.status) as any}>
          {VACATION_STATUS_LABELS[vacation.status] ?? vacation.status}
        </Badge>
        <VacationExpiryBadge vacation={vacation} />
      </View>
    </Card>
  );
}

export function VacationPeriodsCard({ vacation }: { vacation: Vacation }) {
  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconCalendar size={20} />} title="Períodos" />
      <Row label="Colaborador" value={vacation.user?.name ?? "—"} />
      <Row label="Início Aquisitivo" value={formatDate(vacation.acquisitiveStart)} />
      <Row label="Fim Aquisitivo" value={formatDate(vacation.acquisitiveEnd)} />
      <Row label="Limite Concessivo" value={formatDate(vacation.concessiveEnd)} />
      {vacation.paymentDueDate ? (
        <Row label="Pagamento Previsto" value={formatDate(vacation.paymentDueDate)} />
      ) : null}
      {vacation.paymentDate ? <Row label="Pago em" value={formatDate(vacation.paymentDate)} /> : null}
    </Card>
  );
}

export function VacationEntitlementCard({ vacation }: { vacation: Vacation }) {
  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconCalendarStats size={20} />} title="Direito a Férias" />
      <Row label="Faltas Injustificadas" value={String(vacation.unjustifiedAbsencesInPeriod ?? 0)} />
      <Row label="Dias de Direito (art. 130)" value={`${vacation.entitledDays ?? 0} dias`} />
      <Row label="Abono Pecuniário" value={`${vacation.abonoPecuniarioDays ?? 0} dias`} />
      <Row label="Vendeu 1/3" value={vacation.soldThird ? "Sim" : "Não"} />
      <Row label="Férias em Dobro (art. 137)" value={vacation.isDouble ? "Sim" : "Não"} />
    </Card>
  );
}

export function VacationFracionamentoCard({ vacation }: { vacation: Vacation }) {
  const periods = vacation.periods ?? [];
  if (periods.length === 0) return null;
  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconCalendarTime size={20} />} title="Fracionamento" />
      {periods.map((p, i) => (
        <Row key={p.id ?? i} label={`Período ${i + 1}`} value={`${formatDate(p.startDate)} · ${p.days} dias`} />
      ))}
    </Card>
  );
}

export function VacationValuesCard({ vacation }: { vacation: Vacation }) {
  const hasValues =
    vacation.baseRemuneration != null ||
    vacation.oneThird != null ||
    vacation.abonoAmount != null ||
    vacation.inss != null ||
    vacation.irrf != null;
  if (!hasValues) return null;
  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconAlertTriangle size={20} />} title="Valores Calculados" />
      {vacation.baseRemuneration != null ? (
        <Row label="Base de Remuneração" value={formatCurrency(vacation.baseRemuneration)} />
      ) : null}
      {vacation.oneThird != null ? <Row label="1/3 Constitucional" value={formatCurrency(vacation.oneThird)} /> : null}
      {vacation.abonoAmount != null ? <Row label="Abono Pecuniário" value={formatCurrency(vacation.abonoAmount)} /> : null}
      {vacation.inss != null ? <Row label="INSS" value={formatCurrency(vacation.inss)} /> : null}
      {vacation.irrf != null ? <Row label="IRRF" value={formatCurrency(vacation.irrf)} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  rowLabel: { fontSize: 14, opacity: 0.7, flexShrink: 1, marginRight: spacing.md },
  rowValue: { fontSize: 14, fontWeight: "500", textAlign: "right", flexShrink: 1 },
});
