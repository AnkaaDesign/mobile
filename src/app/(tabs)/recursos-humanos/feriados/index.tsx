import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Holidays (Feriados) index page
 * Redirects to the list view as the default page for this section
 */
export default function FeriadosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/feriados/listar" />;
}
