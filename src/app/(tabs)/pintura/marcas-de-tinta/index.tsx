import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MarcasDeTintaIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/pintura/marcas-de-tinta/listar" />;
}
