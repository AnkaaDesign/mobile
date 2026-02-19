import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CronogramaIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/producao/cronograma/listar" />;
}
