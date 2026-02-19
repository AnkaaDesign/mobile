import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function NiveisDeDesempenhoIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/niveis-de-desempenho/listar" />;
}
