import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconPercentage } from "@tabler/icons-react-native";

import { useSalaryAdjustment, useSalaryAdjustmentMutations } from "@/hooks/useSalaryAdjustment";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, SALARY_ADJUSTMENT_TYPE } from "@/constants";
import { SALARY_ADJUSTMENT_TYPE_LABELS } from "@/constants/enum-labels";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import { formatDate } from "@/utils/formatters";
import {
  SalaryAdjustmentSummaryCard,
  SalaryAdjustmentItemsCard,
} from "@/components/human-resources/salary-adjustment";
import type { SalaryAdjustment } from "@/types";

export default function SalaryAdjustmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const adjustmentId = id || "";
  const { deleteMutation } = useSalaryAdjustmentMutations();

  const query = useSalaryAdjustment(adjustmentId, {
    include: {
      appliedBy: true,
      items: { include: { position: true } },
    },
    enabled: !!adjustmentId,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconPercentage}
      title={(a: SalaryAdjustment) =>
        `${SALARY_ADJUSTMENT_TYPE_LABELS[a.type] || a.type} — ${formatDate(a.effectiveDate)}`
      }
      privilege={{
        any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este reajuste salarial? A exclusão remove apenas o registro do histórico — as remunerações atuais dos cargos não serão alteradas. Esta ação não pode ser desfeita.",
        successRoute: "/recursos-humanos/reajustes/listar" as any,
      }}
      deletePrivilege={SECTOR_PRIVILEGES.ADMIN}
      notFoundFallback={"/recursos-humanos/reajustes/listar" as any}
    >
      {(adjustment: SalaryAdjustment) => (
        <View style={styles.body}>
          <SalaryAdjustmentSummaryCard adjustment={adjustment} />
          <SalaryAdjustmentItemsCard
            items={adjustment.items ?? []}
            isBonus={adjustment.type === SALARY_ADJUSTMENT_TYPE.BONUS}
          />
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.SALARY_ADJUSTMENT}
            entityId={adjustment.id}
            entityName={`Reajuste - ${SALARY_ADJUSTMENT_TYPE_LABELS[adjustment.type] || adjustment.type}`}
            entityCreatedAt={adjustment.createdAt}
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
