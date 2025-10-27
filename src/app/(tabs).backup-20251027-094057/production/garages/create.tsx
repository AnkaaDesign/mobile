import { Stack } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function ProducaoGaragensCreateScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Garagem",
          headerShown: true,
        }}
      />
      <UnderConstruction
        title="Cadastrar Garagem"
        description="Em breve você poderá cadastrar novas garagens com informações sobre localização, capacidade e configuração de baias de estacionamento."
      />
    </>
  );
}
