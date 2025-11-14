import { Stack } from "expo-router";
import { Layout } from "@/components/list/Layout";
import { paintBrandsListConfig } from "@/config/list/painting";

export default function PaintBrandListScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Marcas de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <Layout config={paintBrandsListConfig} />
    </>
  );
}
