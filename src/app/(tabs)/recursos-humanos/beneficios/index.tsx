import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BeneficiosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/beneficios/listar" />;
}
