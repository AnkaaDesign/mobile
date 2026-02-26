import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { PositionForm } from "@/components/human-resources/position/form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function PositionsCreateScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Novo Cargo",
          headerShown: true,
        }}
      />
      <PositionForm key={formKey} mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
