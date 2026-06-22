import { Redirect } from "expo-router";

// Controle de Ponto defaults to the "Visualização Colaborador" sub-view.
export default function ControlePontoIndexScreen() {
  // Cast: expo-router's generated typed-routes union is regenerated at build/start
  // time and may not include freshly-added sibling routes during tsc.
  return <Redirect href={"/recursos-humanos/controle-ponto/colaborador" as any} />;
}
