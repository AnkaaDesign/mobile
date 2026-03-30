import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function NotasFiscaisIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/financeiro/notas-fiscais/listar" />;
}
