import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { BonusForm } from "@/components/human-resources/bonus/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useBonus } from "@/hooks/bonus";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BonusEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bonus, isLoading, error, refetch } = useBonus(id!);

  useScreenReady(!isLoading);

  if (isLoading) {
    return null;
  }

  if (error || !bonus) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar bônus"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Bônus",
          headerShown: true,
        }}
      />
      <BonusForm mode="update" bonus={bonus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
