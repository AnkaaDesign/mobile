import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { TerminationForm } from "@/components/human-resources/termination/form/termination-form";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function TerminationCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <TerminationCreateScreenInner />
    </PrivilegeGate>
  );
}

function TerminationCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Rescisão",
          headerShown: true,
        }}
      />
      <TerminationForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
