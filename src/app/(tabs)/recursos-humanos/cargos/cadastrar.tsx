import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { PositionForm } from "@/components/human-resources/position/form";

export default function PositionsCreateScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Novo Cargo",
          headerShown: true,
        }}
      />
      <PositionForm mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
