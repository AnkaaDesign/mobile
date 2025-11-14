import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { VacationForm } from "@/components/human-resources/vacation/form";

export default function CreateVacationScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Férias",
          headerShown: true,
        }}
      />
      <VacationForm mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
