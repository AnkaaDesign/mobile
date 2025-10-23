import { Stack } from "expo-router";

export default function CuttingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="list" options={{ title: "Recortes" }} />
      <Stack.Screen name="cutting-plan" options={{ title: "Plano de Recorte" }} />
      <Stack.Screen name="cutting-plan/create" options={{ title: "Criar Plano de Recorte" }} />
      <Stack.Screen name="cutting-plan/list" options={{ title: "Listar Planos" }} />
      <Stack.Screen name="cutting-plan/details/[id]" options={{ title: "Detalhes do Plano" }} />
      <Stack.Screen name="cutting-plan/edit/[id]" options={{ title: "Editar Plano" }} />
      <Stack.Screen name="cutting-request" options={{ title: "Requisição de Recorte" }} />
      <Stack.Screen name="cutting-request/create" options={{ title: "Criar Requisição" }} />
      <Stack.Screen name="cutting-request/list" options={{ title: "Listar Requisições" }} />
      <Stack.Screen name="cutting-request/details/[id]" options={{ title: "Detalhes da Requisição" }} />
      <Stack.Screen name="cutting-request/edit/[id]" options={{ title: "Editar Requisição" }} />
    </Stack>
  );
}
