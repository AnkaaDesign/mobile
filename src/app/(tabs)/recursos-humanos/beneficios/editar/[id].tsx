import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { UserBenefitForm } from "@/components/personnel-department/user-benefit/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useUserBenefit } from "@/hooks/useUserBenefit";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function UserBenefitEditScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}>
      <UserBenefitEditScreenInner />
    </PrivilegeGate>
  );
}

function UserBenefitEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUserBenefit(id!, {
    include: {
      // remunerations = salário-base, usado no preview Empresa × Colaborador
      user: { include: { position: { include: { remunerations: true } }, sector: true } },
      benefit: true,
    },
    enabled: !!id,
  });

  useScreenReady(!isLoading);
  const userBenefit = response?.data;

  if (isLoading) {
    return null;
  }

  if (error || !userBenefit) {
    return <ErrorScreen message={error?.message || "Erro ao carregar adesão"} onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Adesão",
          headerShown: true,
        }}
      />
      <UserBenefitForm key={id} mode="update" userBenefit={userBenefit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
