import { Redirect } from "expo-router";

// Redirect to Secullum calculations (HR calculations)
export default function HumanResourcesCalculationsScreen() {
  return <Redirect href="/(tabs)/integracoes/secullum/calculos/listar" />;
}
