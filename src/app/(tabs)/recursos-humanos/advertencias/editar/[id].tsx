import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WarningForm } from "@/components/human-resources/warning/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useWarning } from "@/hooks/useWarning";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function WarningEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER] }}
    >
      <WarningEditScreenInner />
    </PrivilegeGate>
  );
}

function WarningEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: warningResponse, isLoading, error, refetch } = useWarning(id!, {
    include: {
      collaborator: { include: { position: true } },
      supervisor: { include: { position: true } },
      witness: true,
      attachments: true,
    }
  });

  useScreenReady(!isLoading);
  const warning = warningResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !warning) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar advertência"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Advertência",
          headerShown: true,
        }}
      />
      <WarningForm key={id} mode="update" warning={warning} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
