import { Stack } from "expo-router";

export default function FormulasLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Voltar",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="list" options={{ title: "Fórmulas de Tinta" }} />
      <Stack.Screen name="create" options={{ title: "Criar Fórmula" }} />
      <Stack.Screen name="details/[id]" options={{ title: "Detalhes da Fórmula" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Editar Fórmula" }} />
      <Stack.Screen name="[formulaId]/components/list" options={{ title: "Componentes da Fórmula" }} />
      <Stack.Screen name="[formulaId]/components/create" options={{ title: "Adicionar Componente" }} />
      <Stack.Screen name="[formulaId]/components/details/[id]" options={{ title: "Detalhes do Componente" }} />
      <Stack.Screen name="[formulaId]/components/edit/[id]" options={{ title: "Editar Componente" }} />
    </Stack>
  );
}
