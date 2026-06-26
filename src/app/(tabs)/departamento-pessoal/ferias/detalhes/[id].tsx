import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconBeach, IconCash, IconCheck } from "@tabler/icons-react-native";

import { useVacation, useVacationMutations, useVacationAdvance } from "@/hooks/useVacation";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, VACATION_STATUS } from "@/constants";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/utils/formatters";
import { useNav } from "@/contexts/nav";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import {
  VacationStatusStepperCard,
  VacationSummaryCard,
  VacationPeriodBalanceCard,
  VacationReciboCard,
} from "@/components/personnel-department/vacation";
import type { Vacation } from "@/types";

/**
 * Inline "Marcar como pago" action — lives at the foot of the Recibo de Férias
 * card (paying the férias IS paying this recibo). Collects a payment date, stamps
 * it via updateVacation({ paymentDate }), then advances the status machine to
 * PAID. Disabled until the recibo exists (baseRemuneration != null).
 */
function PaymentSlot({ vacation }: { vacation: Vacation }) {
  const { colors } = useTheme();
  const nav = useNav();
  const { updateAsync } = useVacationMutations();
  const advance = useVacationAdvance();
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  const isPaid = vacation.status === VACATION_STATUS.PAID;
  const reciboReady = vacation.baseRemuneration != null;
  const isPending = advance.isPending;

  if (isPaid) {
    return (
      <View style={styles.paidRow}>
        <View style={styles.paidLeft}>
          <IconCheck size={16} color="#16a34a" />
          <ThemedText style={[styles.paidText, { color: "#16a34a" }]}>Férias paga</ThemedText>
        </View>
        <ThemedText style={{ color: colors.mutedForeground }}>
          {vacation.paymentDate ? formatDate(vacation.paymentDate) : ""}
        </ThemedText>
      </View>
    );
  }

  const handleMarkPaid = async () => {
    if (!paymentDate || !reciboReady) return;
    try {
      await nav.withLoading(async () => {
        await updateAsync({ id: vacation.id, data: { paymentDate } as any });
        await advance.mutateAsync({ id: vacation.id });
      });
    } catch {
      // api-client surfaces the error toast.
    }
  };

  return (
    <View style={styles.paySlot}>
      <ThemedText style={[styles.payHint, { color: colors.mutedForeground }]}>
        {reciboReady
          ? "Informe a data de pagamento e conclua como Paga."
          : "O recibo ainda não foi calculado — não é possível concluir o pagamento."}
      </ThemedText>
      <DatePicker
        mode="date"
        value={paymentDate}
        onChange={(d) => setPaymentDate(d instanceof Date ? d : undefined)}
        placeholder="Data de pagamento"
      />
      <Button
        variant="default"
        loading={isPending}
        disabled={!reciboReady || !paymentDate || isPending}
        onPress={handleMarkPaid}
        icon={<IconCash size={16} color={colors.primaryForeground} />}
      >
        Marcar como pago
      </Button>
    </View>
  );
}

export default function VacationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacationId = id || "";
  const { deleteMutation } = useVacationMutations();

  // Manage (edit / mark-as-paid) is ACCOUNTING/HR/ADMIN — PRODUCTION_MANAGER has
  // read-only access (mirrors the API @Roles and the web detail page). The page
  // privilege below grants PM view-only; these write actions exclude PM.
  const MANAGE_PRIVILEGE = {
    any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
  };
  const canManage = usePrivilegeGate(MANAGE_PRIVILEGE).allowed;

  const query = useVacation(vacationId, {
    include: {
      user: { include: { position: true, sector: true } },
    },
    enabled: !!vacationId,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconBeach}
      title={(v: Vacation) => (v.user?.name ? `Férias — ${v.user.name}` : "Férias")}
      privilege={{
        any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER],
      }}
      editRoute={(v: Vacation) => `/departamento-pessoal/ferias/editar/${v.id}` as any}
      editPrivilege={MANAGE_PRIVILEGE}
      // Editar is hidden once the vacation is PAID (PAID is terminal).
      editGuard={{ field: "status", editable: [VACATION_STATUS.SCHEDULED, VACATION_STATUS.EXPIRED] }}
      hideTerminalBanner
      deleteAction={{
        mutation: deleteMutation,
        confirmText: "Tem certeza que deseja excluir o registro de férias? Esta ação não pode ser desfeita.",
        successRoute: "/departamento-pessoal/ferias/listar" as any,
      }}
      deletePrivilege={SECTOR_PRIVILEGES.ADMIN}
      notFoundFallback={"/departamento-pessoal/ferias/listar" as any}
    >
      {(v: Vacation) => (
        <View style={styles.body}>
          <VacationStatusStepperCard vacation={v} />
          <VacationSummaryCard vacation={v} />
          <VacationPeriodBalanceCard vacation={v} />
          <VacationReciboCard vacation={v} paymentSlot={canManage ? <PaymentSlot vacation={v} /> : undefined} />
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.VACATION}
            entityId={v.id}
            entityName={`Férias - ${v.user?.name || "Sem nome"}`}
            entityCreatedAt={v.createdAt}
            maxHeight={400}
          />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  paySlot: { gap: spacing.sm },
  payHint: { fontSize: 13, lineHeight: 18 },
  paidRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paidLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  paidText: { fontSize: 14, fontWeight: "600" },
});
