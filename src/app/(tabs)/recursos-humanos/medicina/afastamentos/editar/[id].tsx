import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { LeaveForm } from "@/components/human-resources/leave/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useLeave } from "@/hooks/useLeave";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function LeaveEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <LeaveEditScreenInner />
    </PrivilegeGate>
  );
}

function LeaveEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: leaveResponse, isLoading, error, refetch } = useLeave(id!, {
    include: { user: { include: { position: true } }, files: true },
  });

  useScreenReady(!isLoading);
  const leave = leaveResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !leave) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar afastamento"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Afastamento",
          headerShown: true,
        }}
      />
      <LeaveForm key={id} mode="update" leave={leave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
