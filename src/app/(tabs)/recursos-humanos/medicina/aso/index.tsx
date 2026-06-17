import { Redirect } from "expo-router";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function MedicinaAsoIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/medicina/aso/listar" />;
}
