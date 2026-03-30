import { Stack } from "expo-router";

export default function OrcamentoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Orcamentos",
        }}
      />
      <Stack.Screen
        name="listar"
        options={{
          title: "Orcamentos",
        }}
      />
      <Stack.Screen
        name="detalhes/[taskId]"
        options={{
          title: "Orcamento da Tarefa",
          headerShown: true,
          headerBackTitle: "Voltar",
        }}
      />
    </Stack>
  );
}
