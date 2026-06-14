import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function WorkAccidentsIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/medicina/cat/listar" />;
}
