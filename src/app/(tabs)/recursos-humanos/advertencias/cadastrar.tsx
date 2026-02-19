import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { WarningForm } from "@/components/human-resources/warning/form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function HumanResourcesWarningsCreateScreen() {
  useScreenReady();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Advertência",
          headerShown: true,
        }}
      />
      <WarningForm mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
