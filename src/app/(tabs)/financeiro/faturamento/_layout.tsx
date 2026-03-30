import { Stack } from "expo-router";

export default function FaturamentoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Faturamento",
        }}
      />
      <Stack.Screen
        name="listar"
        options={{
          title: "Faturamento",
        }}
      />
      <Stack.Screen
        name="detalhes/[id]"
        options={{
          title: "Faturamento da Tarefa",
        }}
      />
    </Stack>
  );
}
