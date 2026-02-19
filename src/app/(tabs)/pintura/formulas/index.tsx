import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function FormulasIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/pintura/formulas/listar" />;
}
