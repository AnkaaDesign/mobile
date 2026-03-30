import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function FinanceiroClientesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/financeiro/clientes/listar" />;
}
