import { Stack } from "expo-router";

export default function CalculationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ title: "Cálculos" }} />
      <Stack.Screen name="list" options={{ title: "Listar Cálculos" }} />
    </Stack>
  );
}
