import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { BonusForm } from "@/components/human-resources/bonus/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function BonusCreateScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Cadastrar Bônus",
          headerShown: true,
        }}
      />
      <BonusForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
