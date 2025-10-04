import { Stack } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function ProducaoGaragensListScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Lista de Garagens",
          headerShown: true,
        }}
      />
      <UnderConstruction
        title="Lista de Garagens"
        description="Em breve você poderá visualizar e gerenciar todas as garagens cadastradas no sistema, com informações detalhadas sobre baias e ocupação."
      />
    </>
  );
}
