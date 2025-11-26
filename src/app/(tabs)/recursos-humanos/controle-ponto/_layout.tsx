import { Stack } from "expo-router";

export default function ControlePontoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="listar"
        options={{
          title: "Controle de Ponto",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          title: "Controle de Ponto",
        }}
      />
    </Stack>
  );
}
