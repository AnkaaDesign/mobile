import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { WorkAccidentForm } from "@/components/human-resources/work-accident/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function WorkAccidentCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <WorkAccidentCreateScreenInner />
    </PrivilegeGate>
  );
}

function WorkAccidentCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar CAT",
          headerShown: true,
        }}
      />
      <WorkAccidentForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
