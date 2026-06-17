import { Redirect } from "expo-router";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function RescisoesIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/rescisoes/listar" />;
}
