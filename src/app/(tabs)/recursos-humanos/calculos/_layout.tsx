import { Stack } from "expo-router";

export default function CalculosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="listar"
        options={{
          title: "Cálculos de Ponto",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          title: "Cálculos de Ponto",
        }}
      />
    </Stack>
  );
}
