import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProducoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/pintura/producoes/listar" />;
}
