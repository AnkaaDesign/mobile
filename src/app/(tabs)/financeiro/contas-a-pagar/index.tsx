import { Redirect } from "expo-router";
import type { Href } from "expo-router";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function ContasAPagarIndex() {
  useScreenReady();
  // Cast: expo-router typed routes are regenerated from the file tree on the
  // dev server; this brand-new route isn't in the generated union yet.
  return <Redirect href={"/(tabs)/financeiro/contas-a-pagar/listar" as Href} />;
}
