import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { LeaveForm } from "@/components/personnel-department/leave/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function LeaveCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <LeaveCreateScreenInner />
    </PrivilegeGate>
  );
}

function LeaveCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Afastamento",
          headerShown: true,
        }}
      />
      <LeaveForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
