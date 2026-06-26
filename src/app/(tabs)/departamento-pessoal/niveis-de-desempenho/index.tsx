import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function NiveisDeDesempenhoIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/departamento-pessoal/niveis-de-desempenho/listar" />;
}
