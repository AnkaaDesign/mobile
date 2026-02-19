import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AerografiaIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/producao/aerografia/listar" />;
}
