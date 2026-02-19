import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Positions (Cargos) index page
 * Redirects to the list view as the default page for this section
 */
export default function CargosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/cargos/listar" />;
}
