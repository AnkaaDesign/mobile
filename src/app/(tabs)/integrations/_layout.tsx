import { Stack } from "expo-router";

export default function IntegrationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ title: "Integrações" }} />
      {/* secullum folder has its own _layout.tsx, so it's handled automatically by Expo Router */}
    </Stack>
  );
}
