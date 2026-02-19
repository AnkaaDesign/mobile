import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Collaborators index page
 * Redirects to the list view as the default page for this section
 */
export default function CollaboratorsIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/administracao/colaboradores/listar" />;
}
