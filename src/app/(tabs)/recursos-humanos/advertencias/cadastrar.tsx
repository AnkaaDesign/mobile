import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { WarningForm } from "@/components/human-resources/warning/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function HumanResourcesWarningsCreateScreen() {
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
