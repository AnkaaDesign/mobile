import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function RequisicoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/requisicoes/listar" />;
}
