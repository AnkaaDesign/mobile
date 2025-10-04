import { Stack } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function PaintingPaintTypesScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Tipos de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <UnderConstruction title="Tipos de Tinta" />
    </>
  );
}
