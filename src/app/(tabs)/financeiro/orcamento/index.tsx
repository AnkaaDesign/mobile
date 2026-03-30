import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function OrcamentoIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/financeiro/orcamento/listar" />;
}
