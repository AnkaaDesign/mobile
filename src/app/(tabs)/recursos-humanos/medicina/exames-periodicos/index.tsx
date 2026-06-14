import { Redirect } from "expo-router";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function ExamesPeriodicosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/medicina/exames-periodicos/listar" />;
}
