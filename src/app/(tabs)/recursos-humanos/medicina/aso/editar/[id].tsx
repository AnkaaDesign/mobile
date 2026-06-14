import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { MedicalExamForm } from "@/components/human-resources/medical-exam/form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useMedicalExam } from "@/hooks/useMedicalExam";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function MedicalExamEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <MedicalExamEditScreenInner />
    </PrivilegeGate>
  );
}

function MedicalExamEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: examResponse, isLoading, error, refetch } = useMedicalExam(id!, {
    include: { user: { include: { position: true } }, file: true },
  });

  useScreenReady(!isLoading);
  const exam = examResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !exam) {
    return (
      <ErrorScreen
        message={error?.message || "Erro ao carregar exame"}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Editar Exame (ASO)",
          headerShown: true,
        }}
      />
      <MedicalExamForm key={id} mode="update" medicalExam={exam} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
