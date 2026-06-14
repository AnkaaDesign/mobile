import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { AdmissionForm } from "@/components/personnel-department/admission/form/admission-form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useAdmission } from "@/hooks/useAdmission";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function AdmissionEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <AdmissionEditScreenInner />
    </PrivilegeGate>
  );
}

function AdmissionEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: admissionResponse, isLoading, error, refetch } = useAdmission(id!, {
    include: { user: true },
  });

  useScreenReady(!isLoading);
  const admission = admissionResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !admission) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar admissão"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Admissão",
          headerShown: true,
        }}
      />
      <AdmissionForm key={id} mode="update" admission={admission} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
