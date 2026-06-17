import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconBeach } from "@tabler/icons-react-native";

import { useVacation, useVacationMutations, useVacationAdvance } from "@/hooks/useVacation";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, VACATION_STATUS } from "@/constants";
import { VACATION_STATUS_LABELS } from "@/constants/enum-labels";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import { useNav } from "@/contexts/nav";
import {
  VacationStatusCard,
  VacationPeriodsCard,
  VacationEntitlementCard,
  VacationFracionamentoCard,
  VacationValuesCard,
  VacationReciboCard,
} from "@/components/human-resources/vacation";
import type { Vacation } from "@/types";

// Forward chain of the status machine (EXPIRED handled separately) — mirrors web.
const STATUS_CHAIN: VACATION_STATUS[] = [
  VACATION_STATUS.OPEN,
  VACATION_STATUS.SCHEDULED,
  VACATION_STATUS.IN_PROGRESS,
  VACATION_STATUS.PAID,
];

function getNextStatus(status: VACATION_STATUS): VACATION_STATUS | null {
  const i = STATUS_CHAIN.indexOf(status);
  if (i === -1) return null;
  return STATUS_CHAIN[i + 1] ?? null;
}

export default function VacationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacationId = id || "";
  const nav = useNav();
  const { deleteMutation } = useVacationMutations();
  const advance = useVacationAdvance();

  const query = useVacation(vacationId, {
    include: {
      user: { include: { position: true, sector: true } },
      periods: { orderBy: { startDate: "asc" } },
    },
    enabled: !!vacationId,
  });

  const vacation = (query.data as any)?.data as Vacation | undefined;

  const isFinal =
    vacation?.status === VACATION_STATUS.PAID || vacation?.status === VACATION_STATUS.EXPIRED;
  const nextStatus = vacation ? getNextStatus(vacation.status) : null;
  const nextIsPaid = nextStatus === VACATION_STATUS.PAID;

  let advanceDisabledReason: string | null = null;
  if (vacation) {
    if (isFinal || !nextStatus) {
      advanceDisabledReason = `Não é possível alterar o status de umas férias ${VACATION_STATUS_LABELS[vacation.status].toLowerCase()}.`;
    } else if (nextIsPaid && !vacation.paymentDate) {
      advanceDisabledReason = "Não é possível concluir como Pago: a data de pagamento não foi informada (edite as férias).";
    }
  }

  const handleAdvance = () => {
    if (!vacation || advanceDisabledReason) return;
    Alert.alert(
      "Avançar status das férias",
      `Avançar de ${VACATION_STATUS_LABELS[vacation.status]} para ${nextStatus ? VACATION_STATUS_LABELS[nextStatus] : "-"}?`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Avançar",
          onPress: async () => {
            try {
              await nav.withLoading(async () => advance.mutateAsync({ id: vacation.id }));
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
          key: "advance",
          label: "Avançar Status",
          icon: "player-track-next",
          onPress: handleAdvance,
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
          <VacationFracionamentoCard vacation={v} />
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
