import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { VacationForm } from "@/components/human-resources/vacation";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useVacation } from "@/hooks/useVacation";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function VacationEditScreen() {
  // Edit is a write op — ACCOUNTING/HR/ADMIN only (PM is read-only, mirrors the
  // API @Roles and the web edit page).
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}>
      <VacationEditScreenInner />
    </PrivilegeGate>
  );
}

function VacationEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useVacation(id!, {
    include: { user: { include: { position: true } } },
    enabled: !!id,
  });

  useScreenReady(!isLoading);
  const vacation = (data as any)?.data;

  if (isLoading) return null;

  if (error || !vacation) {
    return <ErrorScreen message={(error as any)?.message || "Erro ao carregar férias"} onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Editar Férias", headerShown: true }} />
      <VacationForm key={id} mode="update" vacation={vacation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
