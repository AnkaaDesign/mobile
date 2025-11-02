import { Redirect } from "expo-router";

/**
 * Warnings (Avisos) index page
 * Redirects to the list view as the default page for this section
 */
export default function AvisosIndex() {
  return <Redirect href="/(tabs)/recursos-humanos/advertencias/listar" />;
}
