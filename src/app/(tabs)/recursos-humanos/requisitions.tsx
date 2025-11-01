import { Redirect } from "expo-router";

// Redirect to Secullum time adjustment requests (requisitions)
export default function HumanResourcesRequisitionsScreen() {
  return <Redirect href="/(tabs)/integracoes/secullum/requisicoes/listar" />;
}
