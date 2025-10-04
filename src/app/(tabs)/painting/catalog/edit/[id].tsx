import { Stack, useLocalSearchParams } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function EditCatalogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <UnderConstruction title="Editar Tinta" />
    </>
  );
}
