import { Redirect } from "expo-router";

/**
 * Collaborators index page
 * Redirects to the list view as the default page for this section
 */
export default function CollaboratorsIndex() {
  return <Redirect href="/(tabs)/administracao/colaboradores/listar" />;
}
