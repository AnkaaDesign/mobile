import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AdvertenciasIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/advertencias/listar" />;
}
