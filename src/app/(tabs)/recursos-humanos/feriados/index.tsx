import { Redirect } from "expo-router";

/**
 * Holidays (Feriados) index page
 * Redirects to the list view as the default page for this section
 */
export default function FeriadosIndex() {
  return <Redirect href="/(tabs)/recursos-humanos/feriados/listar" />;
}
