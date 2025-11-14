import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WarningForm } from "@/components/human-resources/warning/form";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useWarning } from "@/hooks/useWarning";

export default function WarningEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: warning, isLoading, error, refetch } = useWarning(id!, {
    include: { witness: true, attachments: true }
  });

  if (isLoading) {
    return <LoadingScreen message="Carregando advertência..." />;
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
      <WarningForm mode="update" warning={warning} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
