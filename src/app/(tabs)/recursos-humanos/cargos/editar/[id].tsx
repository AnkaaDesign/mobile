import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { PositionForm } from "@/components/human-resources/position/form";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { usePosition } from "@/hooks/usePosition";

export default function PositionEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: positionResponse, isLoading, error, refetch } = usePosition(id!);
  const position = positionResponse?.data;

  if (isLoading) {
    return <LoadingScreen message="Carregando cargo..." />;
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
      <PositionForm mode="update" position={position} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
