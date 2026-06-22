import { Stack } from "expo-router";

export default function ControlePontoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Controle de Ponto" }} />
      <Stack.Screen name="colaborador" options={{ title: "Visualização Colaborador" }} />
      <Stack.Screen name="dia" options={{ title: "Visualização Dia" }} />
      <Stack.Screen name="edicao" options={{ title: "Edição" }} />
      <Stack.Screen name="ausencias" options={{ title: "Ausências" }} />
      <Stack.Screen name="fechamento/index" options={{ title: "Fechamento" }} />
      <Stack.Screen name="fechamento/[id]" options={{ title: "Fechamento" }} />
      <Stack.Screen name="detalhes/[id]" options={{ title: "Registro de Ponto" }} />
    </Stack>
  );
}
