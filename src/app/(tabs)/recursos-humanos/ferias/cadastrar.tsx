import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { VacationForm } from "@/components/human-resources/vacation/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateVacationScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Férias",
          headerShown: true,
        }}
      />
      <VacationForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
