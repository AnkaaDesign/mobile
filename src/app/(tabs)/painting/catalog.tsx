import { Stack } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function PaintingCatalogScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Catálogo de Tintas",
          headerBackTitle: "Voltar",
        }}
      />
      <UnderConstruction title="Catálogo de Tintas" />
    </>
  );
}
