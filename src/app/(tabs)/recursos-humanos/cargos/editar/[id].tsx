import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { PositionForm } from "@/components/human-resources/position/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { usePosition } from "@/hooks/usePosition";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

// NOTE: PositionForm self-manages its mutation/navigation. Keeping this thin
// wrapper around it (rather than wiring through <FormScreen>) preserves the
// shared form's existing behavior; migrate to <FormScreen> when PositionForm
// is refactored to expose a `flow`-driven surface.
export default function PositionEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <PositionEditScreenInner />
    </PrivilegeGate>
  );
}

function PositionEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: positionResponse, isLoading, error, refetch } = usePosition(id!);

  useScreenReady(!isLoading);
  const position = positionResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !position) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar cargo"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Cargo",
          headerShown: true,
        }}
      />
      <PositionForm key={id} mode="update" position={position} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
