import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Horarios (Schedules) index page
 * Redirects to the list view as the default page for this section
 */
export default function HorariosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/horarios/listar" />;
}
