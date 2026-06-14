import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AdmissoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/admissoes/listar" />;
}
