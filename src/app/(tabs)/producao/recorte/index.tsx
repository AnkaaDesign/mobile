import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function RecorteIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/producao/recorte/listar" />;
}
