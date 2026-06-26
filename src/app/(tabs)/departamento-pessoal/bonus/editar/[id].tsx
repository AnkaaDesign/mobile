import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { BonusForm } from "@/components/personnel-department/bonus/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useBonus } from "@/hooks/bonus";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function BonusEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <BonusEditScreenInner />
    </PrivilegeGate>
  );
}

function BonusEditScreenInner() {
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
      <BonusForm key={id} mode="update" bonus={bonus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
