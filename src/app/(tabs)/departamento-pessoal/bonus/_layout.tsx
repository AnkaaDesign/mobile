import { Stack } from "expo-router";

export default function BonusLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Bônus",
        }}
      />
      <Stack.Screen
        name="listar"
        options={{
          title: "Bônus",
        }}
      />
      <Stack.Screen
        name="cadastrar"
        options={{
          title: "Cadastrar Bônus",
        }}
      />
      <Stack.Screen
        name="detalhes/[id]"
        options={{
          title: "Detalhes do Bônus",
        }}
      />
      <Stack.Screen
        name="editar/[id]"
        options={{
          title: "Editar Bônus",
        }}
      />
      <Stack.Screen
        name="nivel-de-performance/index"
        options={{
          title: "Níveis de Performance",
        }}
      />
      <Stack.Screen
        name="simulacao/index"
        options={{
          title: "Simulação de Bônus",
        }}
      />
    </Stack>
  );
}
