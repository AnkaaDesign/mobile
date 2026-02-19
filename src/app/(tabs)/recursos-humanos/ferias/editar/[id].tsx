import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { VacationForm } from "@/components/human-resources/vacation/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useVacation } from "@/hooks/useVacation";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function VacationEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vacationResponse, isLoading, error, refetch } = useVacation(id!);

  useScreenReady(!isLoading);
  const vacation = vacationResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !vacation) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar férias"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Férias",
          headerShown: true,
        }}
      />
      <VacationForm mode="update" vacation={vacation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
