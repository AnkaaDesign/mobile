import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { BonusForm } from "@/components/human-resources/bonus/form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BonusCreateScreen() {
  useScreenReady();
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
