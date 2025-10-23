import { Stack } from "expo-router";

export default function SecullumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ title: "Secullum" }} />
      <Stack.Screen name="sync-status" options={{ title: "Status de Sincronização" }} />
      {/* calculations and time-entries folders have their own _layout.tsx, so they're handled automatically by Expo Router */}
    </Stack>
  );
}
