import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="list" options={{ title: "Pedidos" }} />
      <Stack.Screen name="create" options={{ title: "Cadastrar Pedido" }} />
      <Stack.Screen name="details/[id]" options={{ title: "Detalhes do Pedido" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Editar Pedido" }} />
      <Stack.Screen name="[orderId]/items/list" options={{ title: "Itens do Pedido" }} />
      <Stack.Screen name="automatic" options={{ title: "Pedidos Automáticos" }} />
      <Stack.Screen name="automatic/configure" options={{ title: "Configurar Pedidos Automáticos" }} />
      <Stack.Screen name="automatic/list" options={{ title: "Listar Pedidos Automáticos" }} />
      <Stack.Screen name="schedules" options={{ title: "Agendamentos" }} />
      <Stack.Screen name="schedules/create" options={{ title: "Cadastrar Agendamento" }} />
      <Stack.Screen name="schedules/list" options={{ title: "Listar Agendamentos" }} />
      <Stack.Screen name="schedules/details/[id]" options={{ title: "Detalhes do Agendamento" }} />
      <Stack.Screen name="schedules/edit/[id]" options={{ title: "Editar Agendamento" }} />
    </Stack>
  );
}
