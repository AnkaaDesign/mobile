import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ObservacoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/producao/observacoes/listar" />;
}
