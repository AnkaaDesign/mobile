import { Redirect } from "expo-router";

/**
 * Vacations (Férias) index page
 * Redirects to the list view as the default page for this section
 */
export default function FeriasIndex() {
  return <Redirect href="/(tabs)/recursos-humanos/ferias/listar" />;
}
