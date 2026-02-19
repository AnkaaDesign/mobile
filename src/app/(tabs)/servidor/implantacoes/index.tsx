import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ImplantacoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/servidor/implantacoes/listar" />;
}
