import { Stack } from "expo-router";

export default function DeploymentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ title: "Implantações" }} />
      <Stack.Screen name="details/[id]" options={{ title: "Detalhes da Implantação" }} />
    </Stack>
  );
}
