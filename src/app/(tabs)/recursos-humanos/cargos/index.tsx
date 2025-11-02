import { Redirect } from "expo-router";

/**
 * Positions (Cargos) index page
 * Redirects to the list view as the default page for this section
 */
export default function CargosIndex() {
  return <Redirect href="/(tabs)/recursos-humanos/cargos/listar" />;
}
