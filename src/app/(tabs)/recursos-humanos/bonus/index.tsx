import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BonusIndexScreen() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/bonus/listar" />;
}
