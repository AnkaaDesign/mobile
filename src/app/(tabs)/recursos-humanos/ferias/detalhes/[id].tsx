import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconBeach } from "@tabler/icons-react-native";

import { useVacation, useVacationMutations, useVacationAdvance } from "@/hooks/useVacation";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, VACATION_STATUS } from "@/constants";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import { useNav } from "@/contexts/nav";
import {
  VacationStatusCard,
  VacationPeriodsCard,
  VacationEntitlementCard,
  VacationPeriodBalanceCard,
  VacationValuesCard,
  VacationReciboCard,
} from "@/components/human-resources/vacation";
import type { Vacation } from "@/types";

export default function VacationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacationId = id || "";
  const nav = useNav();
  const { deleteMutation } = useVacationMutations();
  const advance = useVacationAdvance();

  const query = useVacation(vacationId, {
    include: {
      user: { include: { position: true, sector: true } },
    },
    enabled: !!vacationId,
  });

  const vacation = (query.data as any)?.data as Vacation | undefined;

  // markPaid: transition SCHEDULED | EXPIRED → PAID. PAID is the only terminal
  // state. Recibo is always present (auto-calculated on create), so the only
  // guard is "not already paid".
  const isPaid = vacation?.status === VACATION_STATUS.PAID;

  let advanceDisabledReason: string | null = null;
  if (vacation && isPaid) {
    advanceDisabledReason = "Estas férias já estão pagas.";
  }

  const handleMarkPaid = () => {
    if (!vacation || advanceDisabledReason) return;
    Alert.alert(
      "Marcar férias como pagas",
      `Confirmar o pagamento do recibo de férias de ${vacation.user?.name ?? "este colaborador"}?`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Marcar como Paga",
          onPress: async () => {
            try {
              await nav.withLoading(async () =>
                advance.mutateAsync({ id: vacation.id, data: { status: VACATION_STATUS.PAID } }),
              );
            } catch {
              // api-client surfaces the error.
            }
          },
        },
      ],
    );
  };

  return (
    <DetailScreen
      query={query as any}
      icon={IconBeach}
      title={(v: Vacation) => (v.user?.name ? `Férias — ${v.user.name}` : "Férias")}
      privilege={{
        any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(v: Vacation) => `/recursos-humanos/ferias/editar/${v.id}` as any}
      actions={[
        {
          key: "markPaid",
          label: "Marcar como Paga",
          icon: "cash",
          onPress: handleMarkPaid,
          disabled: !!advanceDisabledReason || advance.isPending,
        },
      ]}
      deleteAction={{
        mutation: deleteMutation,
        confirmText: "Tem certeza que deseja excluir o registro de férias? Esta ação não pode ser desfeita.",
        successRoute: "/recursos-humanos/ferias/listar" as any,
      }}
      deletePrivilege={SECTOR_PRIVILEGES.ADMIN}
      notFoundFallback={"/recursos-humanos/ferias/listar" as any}
    >
      {(v: Vacation) => (
        <View style={styles.body}>
          <VacationStatusCard vacation={v} />
          <VacationPeriodsCard vacation={v} />
          <VacationEntitlementCard vacation={v} />
          <VacationPeriodBalanceCard vacation={v} />
          <VacationValuesCard vacation={v} />
          <VacationReciboCard vacation={v} />
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
});
