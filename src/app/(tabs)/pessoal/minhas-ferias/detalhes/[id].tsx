import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconBeach } from "@tabler/icons-react-native";

import { useVacation } from "@/hooks/useVacation";
import { DetailScreen } from "@/components/screens/detail-screen";
import { spacing } from "@/constants/design-system";
import {
  VacationStatusStepperCard,
  VacationSummaryCard,
  VacationPeriodBalanceCard,
} from "@/components/personnel-department/vacation";
import type { Vacation } from "@/types";

/**
 * Employee read-only self-service detail for one of the signed-in user's
 * vacations. Reuses the HR detail cards but omits the Recibo and every mutating
 * action (advance / delete / edit).
 */
export default function MyVacationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacationId = id || "";

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
      title={(v: Vacation) => (v.user?.name ? `Férias — ${v.user.name}` : "Minhas Férias")}
      notFoundFallback={"/(tabs)/pessoal/minhas-ferias" as any}
    >
      {(v: Vacation) => (
        <View style={styles.body}>
          <VacationStatusStepperCard vacation={v} />
          <VacationSummaryCard vacation={v} />
          <VacationPeriodBalanceCard vacation={v} />
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
