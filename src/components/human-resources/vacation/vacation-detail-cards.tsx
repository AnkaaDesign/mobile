import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import {
  IconCalendarStats,
  IconAlertTriangle,
  IconProgress,
  IconBeach,
  IconCheck,
} from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { formatDate } from "@/utils/formatters";
import { VACATION_STATUS } from "@/constants/enums";
import { VACATION_STATUS_LABELS } from "@/constants/enum-labels";
import { routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";
import { useVacationPeriodBalance } from "@/hooks/useVacation";
import type { Vacation } from "@/types";
import type { BadgeVariant } from "@/constants/badge-colors";
import {
  daysUntilConcessiveEnd,
  isConcessiveExpired,
  isConcessiveExpiringSoon,
  vacationStatusVariant,
  isVacationInProgress,
} from "./vacation-utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {typeof value === "string" || typeof value === "number" ? (
        <ThemedText style={styles.rowValue}>{value}</ThemedText>
      ) : (
        <View style={styles.rowValueNode}>{value}</View>
      )}
    </View>
  );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      </View>
      {badge}
    </View>
  );
}

/** Concessivo-expiry inline badge (vencido / a vencer ≤60d). Renders nothing when ok. */
export function VacationExpiryBadge({ vacation }: { vacation: Vacation }) {
  const expired = isConcessiveExpired(vacation);
  const expiring = isConcessiveExpiringSoon(vacation);
  const days = daysUntilConcessiveEnd(vacation.concessiveEnd);
  if (expired) return <Badge variant="destructive">Vencido</Badge>;
  if (expiring) return <Badge variant="warning">{`${days}d restantes`}</Badge>;
  return null;
}

/**
 * "Andamento das Férias" status stepper — rail Agendada → Em gozo → Paga.
 * PAID lands on step 2, "Em gozo" (computed) on step 1, otherwise step 0.
 * EXPIRED dims the rail and shows a destructive art. 137 alert.
 */
export function VacationStatusStepperCard({ vacation }: { vacation: Vacation }) {
  const { colors } = useTheme();
  const isExpired = vacation.status === VACATION_STATUS.EXPIRED;
  const isPaid = vacation.status === VACATION_STATUS.PAID;
  const inProgress = isVacationInProgress(vacation);

  const currentIndex = isPaid ? 2 : inProgress ? 1 : 0;

  const STEPS = [
    { key: "scheduled", label: VACATION_STATUS_LABELS[VACATION_STATUS.SCHEDULED] },
    { key: "inProgress", label: "Em gozo" },
    { key: "paid", label: VACATION_STATUS_LABELS[VACATION_STATUS.PAID] },
  ];

  const headerBadge = inProgress ? (
    <Badge variant="active">Em gozo</Badge>
  ) : (
    <Badge variant={vacationStatusVariant(vacation.status) as BadgeVariant}>
      {VACATION_STATUS_LABELS[vacation.status] ?? vacation.status}
    </Badge>
  );

  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconProgress size={20} color={colors.mutedForeground} />} title="Andamento das Férias" badge={headerBadge} />
      <View style={[styles.stepper, isExpired && styles.dimmed]}>
        {STEPS.map((step, idx) => {
          const done = idx < currentIndex;
          const active = idx === currentIndex && !isExpired;
          const color = active ? colors.primary : done ? "#22c55e" : colors.mutedForeground;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.dot, { borderColor: color, backgroundColor: done || active ? color : "transparent" }]}>
                {done ? <IconCheck size={12} color={colors.background} /> : null}
              </View>
              <ThemedText style={{ color: active ? colors.foreground : colors.mutedForeground, fontWeight: active ? "700" : "400" }}>
                {step.label}
              </ThemedText>
            </View>
          );
        })}
      </View>

      {isExpired ? (
        <View style={[styles.alert, { backgroundColor: colors.destructive + "14", borderColor: colors.destructive }]}>
          <View style={styles.alertTitleRow}>
            <IconAlertTriangle size={16} color={colors.destructive} />
            <ThemedText style={[styles.alertTitle, { color: colors.destructive }]}>
              Período concessivo vencido (art. 137)
            </ThemedText>
          </View>
          <ThemedText style={[styles.alertText, { color: colors.foreground }]}>
            O período concessivo expirou sem concessão das férias. As férias são devidas em dobro — ainda podem ser marcadas como pagas.
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

/**
 * "Resumo" — consolidated vacation summary mirroring the web detail page.
 * Single card with collaborator (linked), cargo, setor, status, períodos,
 * direito/abono/gozo de direito, dobro and payment fields.
 */
export function VacationSummaryCard({ vacation }: { vacation: Vacation }) {
  const { colors } = useTheme();
  const nav = useNav();
  const expired = isConcessiveExpired(vacation);
  const expiring = isConcessiveExpiringSoon(vacation);
  const remaining = daysUntilConcessiveEnd(vacation.concessiveEnd);
  const gozoEntitled = Math.max(0, (vacation.entitledDays ?? 0) - (vacation.abonoPecuniarioDays ?? 0));

  const goToCollaborator = () => {
    if (!vacation.userId) return;
    nav.push(mobileRoute(routes.administration.collaborators.details(vacation.userId)));
  };

  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconBeach size={20} color={colors.mutedForeground} />} title="Resumo" />

      <Row
        label="Colaborador"
        value={
          vacation.user ? (
            <Pressable onPress={goToCollaborator}>
              <ThemedText style={[styles.link, { color: colors.primary }]}>{vacation.user.name}</ThemedText>
            </Pressable>
          ) : (
            "—"
          )
        }
      />
      {vacation.user?.position?.name ? <Row label="Cargo" value={vacation.user.position.name} /> : null}
      {vacation.user?.sector?.name ? <Row label="Setor" value={vacation.user.sector.name} /> : null}

      <Row
        label="Status"
        value={
          <Badge variant={vacationStatusVariant(vacation.status) as BadgeVariant}>
            {VACATION_STATUS_LABELS[vacation.status] ?? vacation.status}
          </Badge>
        }
      />

      <Row
        label="Período Aquisitivo"
        value={`${vacation.acquisitiveStart ? formatDate(vacation.acquisitiveStart) : "—"} — ${vacation.acquisitiveEnd ? formatDate(vacation.acquisitiveEnd) : "—"}`}
      />
      <Row
        label="Limite Concessivo"
        value={
          vacation.concessiveEnd ? (
            <View style={styles.inlineValue}>
              <ThemedText
                style={[
                  styles.rowValue,
                  expired ? { color: colors.destructive } : expiring ? { color: "#d97706" } : undefined,
                ]}
              >
                {formatDate(vacation.concessiveEnd)}
              </ThemedText>
              {expired ? (
                <Badge variant="destructive">Vencido</Badge>
              ) : expiring ? (
                <Badge variant="warning">{`${remaining}d restantes`}</Badge>
              ) : null}
            </View>
          ) : (
            "—"
          )
        }
      />
      <Row label="Início do Gozo" value={vacation.startDate ? formatDate(vacation.startDate) : "Não agendado"} />
      <Row label="Dias de Gozo (este período)" value={`${vacation.days ?? 0} dia(s)`} />

      <Row label="Faltas Injustificadas" value={String(vacation.unjustifiedAbsencesInPeriod ?? 0)} />
      <Row label="Dias de Direito (art. 130)" value={`${vacation.entitledDays ?? 0} dias`} />
      <Row label="Abono Pecuniário" value={(vacation.abonoPecuniarioDays ?? 0) > 0 ? `${vacation.abonoPecuniarioDays} dia(s)` : "—"} />
      <Row label="Gozo de Direito (direito − abono)" value={`${gozoEntitled} dias`} />
      <Row label="Vendeu 1/3" value={vacation.soldThird ? "Sim" : "Não"} />
      <Row
        label="Em Dobro (art. 137)"
        value={vacation.isDouble ? <Badge variant="destructive">Em dobro</Badge> : "Não"}
      />

      <Row label="Prazo de Pagamento" value={vacation.paymentDueDate ? formatDate(vacation.paymentDueDate) : "—"} />
      <Row label="Data de Pagamento" value={vacation.paymentDate ? formatDate(vacation.paymentDate) : "—"} />

      {vacation.notes ? <Row label="Observações" value={vacation.notes} /> : null}
    </Card>
  );
}

/**
 * "Saldo do Período Aquisitivo" — remaining-days history across sibling takings
 * (GET /vacations/:id/period-balance). Tiles Direito(gozo)/Abono/Agendados/Restantes
 * + the "Tomadas no período" list (each links to its own detail).
 */
export function VacationPeriodBalanceCard({ vacation }: { vacation: Vacation }) {
  const { colors } = useTheme();
  const nav = useNav();
  const { data, isLoading } = useVacationPeriodBalance(vacation.id, { enabled: !!vacation.id });
  const balance = data?.data;

  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconCalendarStats size={20} color={colors.mutedForeground} />} title="Saldo do Período Aquisitivo" />
      {isLoading ? (
        <ThemedText style={styles.muted}>Carregando saldo...</ThemedText>
      ) : !balance ? (
        <ThemedText style={styles.muted}>Saldo indisponível para este período.</ThemedText>
      ) : (
        <>
          <View style={styles.tiles}>
            <Tile label="Direito (gozo)" value={balance.gozoEntitled} />
            <Tile label="Abono" value={balance.abonoDays} />
            <Tile label="Agendados" value={balance.scheduledDays} />
            <Tile label="Restantes" value={balance.remainingDays} highlight />
          </View>

          <View style={styles.takingsBlock}>
            <ThemedText style={styles.takingsHeader}>Tomadas no período</ThemedText>
            {balance.takings.length === 0 ? (
              <ThemedText style={styles.muted}>Nenhuma tomada registrada.</ThemedText>
            ) : (
              balance.takings.map((t) => {
                const isCurrent = t.id === vacation.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => nav.push(mobileRoute(routes.humanResources.vacations.details(t.id)))}
                    style={[
                      styles.takingRow,
                      { borderColor: colors.border },
                      isCurrent && { borderColor: colors.primary, backgroundColor: colors.primary + "0D" },
                    ]}
                  >
                    <ThemedText style={[styles.takingText, isCurrent && styles.takingCurrent]}>
                      {t.startDate ? formatDate(t.startDate) : "Não agendado"}
                    </ThemedText>
                    <ThemedText style={[styles.muted, { marginRight: spacing.sm }]}>{t.days} dia(s)</ThemedText>
                    <Badge variant={vacationStatusVariant(t.status) as BadgeVariant}>
                      {VACATION_STATUS_LABELS[t.status] ?? t.status}
                    </Badge>
                  </Pressable>
                );
              })
            )}
          </View>
        </>
      )}
    </Card>
  );
}

function Tile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { borderColor: colors.border, backgroundColor: colors.muted }]}>
      <ThemedText style={[styles.tileLabel, { color: colors.mutedForeground }]}>{label}</ThemedText>
      <ThemedText style={[styles.tileValue, highlight && { color: colors.primary }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  rowLabel: { fontSize: 14, opacity: 0.7, flexShrink: 1, marginRight: spacing.md },
  rowValue: { fontSize: 14, fontWeight: "500", textAlign: "right", flexShrink: 1 },
  rowValueNode: { flexShrink: 1, alignItems: "flex-end" },
  inlineValue: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap", justifyContent: "flex-end" },
  link: { fontSize: 14, fontWeight: "500", textDecorationLine: "underline" },
  muted: { fontSize: 14, opacity: 0.7 },
  // Stepper
  stepper: { gap: 10, marginTop: spacing.xs },
  dimmed: { opacity: 0.5 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  alert: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.xs, marginTop: spacing.sm },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  alertTitle: { fontSize: 14, fontWeight: "600" },
  alertText: { fontSize: 13, lineHeight: 18 },
  // Balance tiles
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: "47%",
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center",
  },
  tileLabel: { fontSize: 12 },
  tileValue: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  takingsBlock: { marginTop: spacing.sm, gap: spacing.xs },
  takingsHeader: { fontSize: 13, fontWeight: "600", opacity: 0.8, marginBottom: spacing.xs },
  takingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  takingText: { fontSize: 14, fontWeight: "500", flexShrink: 1 },
  takingCurrent: { fontWeight: "700" },
});
