import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { TerminationForm } from "@/components/human-resources/termination/form/termination-form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTermination } from "@/hooks/useTermination";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function TerminationEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER] }}
    >
      <TerminationEditScreenInner />
    </PrivilegeGate>
  );
}

function TerminationEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: response, isLoading, error, refetch } = useTermination(id!, {
    include: {
      user: { include: { position: true, currentContract: true } },
    },
    enabled: !!id,
  });

  useScreenReady(!isLoading);
  const termination = response?.data;

  if (isLoading) {
    return null;
  }

  if (error || !termination) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar rescisão"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Rescisão",
          headerShown: true,
        }}
      />
      <TerminationForm key={id} mode="update" termination={termination} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
