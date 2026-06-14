import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { AdmissionForm } from "@/components/personnel-department/admission/form/admission-form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function HumanResourcesAdmissionsCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <HumanResourcesAdmissionsCreateScreenInner />
    </PrivilegeGate>
  );
}

function HumanResourcesAdmissionsCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Admissão",
          headerShown: true,
        }}
      />
      <AdmissionForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
