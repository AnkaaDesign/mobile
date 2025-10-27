import { Stack, useLocalSearchParams } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function ProducaoGaragensEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Garagem",
          headerShown: true,
        }}
      />
      <UnderConstruction
        title="Editar Garagem"
        description="Em breve você poderá editar as informações das garagens, incluindo dados de localização, capacidade e configuração de baias."
      />
    </>
  );
}
