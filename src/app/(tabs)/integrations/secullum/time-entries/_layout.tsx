import { Stack } from "expo-router";

export default function TimeEntriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ title: "Registros de Ponto" }} />
      <Stack.Screen name="list" options={{ title: "Listar Registros de Ponto" }} />
      <Stack.Screen name="details/[id]" options={{ title: "Detalhes do Registro de Ponto" }} />
    </Stack>
  );
}
