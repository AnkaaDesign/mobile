import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function TiposDeTintaIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/pintura/tipos-de-tinta/listar" />;
}
