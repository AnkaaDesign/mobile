import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { VacationForm } from "@/components/human-resources/vacation";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function VacationCreateScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER] }}>
      <VacationCreateScreenInner />
    </PrivilegeGate>
  );
}

function VacationCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Cadastrar Férias", headerShown: true }} />
      <VacationForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
