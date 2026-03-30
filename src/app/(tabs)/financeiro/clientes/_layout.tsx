import { Stack } from "expo-router";

export default function FinanceiroClientesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Clientes",
        }}
      />
      <Stack.Screen
        name="listar"
        options={{
          title: "Clientes",
        }}
      />
      <Stack.Screen
        name="cadastrar"
        options={{
          title: "Cadastrar Cliente",
        }}
      />
      <Stack.Screen
        name="detalhes/[id]"
        options={{
          title: "Detalhes do Cliente",
        }}
      />
      <Stack.Screen
        name="editar/[id]"
        options={{
          title: "Editar Cliente",
        }}
      />
    </Stack>
  );
}
