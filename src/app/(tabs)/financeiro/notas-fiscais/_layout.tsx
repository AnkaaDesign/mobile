import { Stack } from "expo-router";

export default function NotasFiscaisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Notas Fiscais",
        }}
      />
      <Stack.Screen
        name="listar"
        options={{
          title: "Notas Fiscais",
        }}
      />
      <Stack.Screen
        name="detalhes/[id]"
        options={{
          title: "Detalhes NFS-e",
        }}
      />
    </Stack>
  );
}
