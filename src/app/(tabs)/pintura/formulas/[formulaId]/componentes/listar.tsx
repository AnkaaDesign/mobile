import { useLocalSearchParams } from "expo-router";
import { Layout } from "@/components/list/Layout";
import { createFormulaComponentsListConfig } from "@/config/list/painting/formula-components";

export default function ComponentListScreen() {
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>();

  const config = createFormulaComponentsListConfig(formulaId!);

  return <Layout config={config} />;
}
