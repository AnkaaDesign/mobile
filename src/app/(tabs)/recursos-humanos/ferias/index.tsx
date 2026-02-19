import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Vacations (Férias) index page
 * Redirects to the list view as the default page for this section
 */
export default function FeriasIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/ferias/listar" />;
}
