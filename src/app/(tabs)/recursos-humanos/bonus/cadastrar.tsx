import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { BonusForm } from "@/components/human-resources/bonus/form";

export default function BonusCreateScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Bônus",
          headerShown: true,
        }}
      />
      <BonusForm mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
