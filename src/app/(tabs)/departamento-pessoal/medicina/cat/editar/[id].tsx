import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WorkAccidentForm } from "@/components/personnel-department/work-accident/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useWorkAccidentReport } from "@/hooks/useWorkAccident";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function WorkAccidentEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <WorkAccidentEditScreenInner />
    </PrivilegeGate>
  );
}

function WorkAccidentEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: response, isLoading, error, refetch } = useWorkAccidentReport(id!, {
    include: {
      user: { include: { position: true } },
      leave: true,
      file: true,
    },
  });

  useScreenReady(!isLoading);
  const report = response?.data;

  if (isLoading) {
    return null;
  }

  if (error || !report) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar CAT"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar CAT",
          headerShown: true,
        }}
      />
      <WorkAccidentForm key={id} mode="update" workAccident={report} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
