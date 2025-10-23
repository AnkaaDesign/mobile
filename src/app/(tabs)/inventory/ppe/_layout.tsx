import { Stack } from "expo-router";

export default function PPELayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="list" options={{ title: "EPIs" }} />
      <Stack.Screen name="create" options={{ title: "Cadastrar EPI" }} />
      <Stack.Screen name="details/[id]" options={{ title: "Detalhes do EPI" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Editar EPI" }} />
      <Stack.Screen name="deliveries" options={{ title: "Entregas de EPI" }} />
      <Stack.Screen name="deliveries/create" options={{ title: "Cadastrar Entrega" }} />
      <Stack.Screen name="deliveries/list" options={{ title: "Listar Entregas" }} />
      <Stack.Screen name="deliveries/details/[id]" options={{ title: "Detalhes da Entrega" }} />
      <Stack.Screen name="deliveries/edit/[id]" options={{ title: "Editar Entrega" }} />
      <Stack.Screen name="schedules" options={{ title: "Agendamentos de EPI" }} />
      <Stack.Screen name="schedules/create" options={{ title: "Cadastrar Agendamento" }} />
      <Stack.Screen name="schedules/list" options={{ title: "Listar Agendamentos" }} />
      <Stack.Screen name="schedules/details/[id]" options={{ title: "Detalhes do Agendamento" }} />
      <Stack.Screen name="schedules/edit/[id]" options={{ title: "Editar Agendamento" }} />
    </Stack>
  );
}
