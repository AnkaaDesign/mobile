import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { WarningForm } from "@/components/human-resources/warning/form";

export default function HumanResourcesWarningsCreateScreen() {
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
