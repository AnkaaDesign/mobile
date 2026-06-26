import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AfastamentosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/departamento-pessoal/medicina/afastamentos/listar" />;
}
