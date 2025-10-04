import { Stack, useLocalSearchParams } from "expo-router";
import { UnderConstruction } from "@/components/ui/under-construction";

export default function ProducaoGaragensDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalhes da Garagem",
          headerShown: true,
        }}
      />
      <UnderConstruction
        title="Detalhes da Garagem"
        description="Em breve você poderá visualizar informações completas da garagem, incluindo baias disponíveis, veículos estacionados e histórico de movimentações."
      />
    </>
  );
}
