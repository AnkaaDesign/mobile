import { Stack } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function CreateCatalogScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <UnderConstruction title="Cadastrar Tinta" />
    </>
  );
}
