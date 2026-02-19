import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { VacationForm } from "@/components/human-resources/vacation/form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateVacationScreen() {
  useScreenReady();
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
