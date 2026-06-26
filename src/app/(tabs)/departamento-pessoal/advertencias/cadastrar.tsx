import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { WarningForm } from "@/components/personnel-department/warning/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function PersonnelDepartmentWarningsCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER] }}
    >
      <PersonnelDepartmentWarningsCreateScreenInner />
    </PrivilegeGate>
  );
}

function PersonnelDepartmentWarningsCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Advertência",
          headerShown: true,
        }}
      />
      <WarningForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
