import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function RegistrosDeAlteracoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/servidor/registros-de-alteracoes/listar" />;
}
