import { Redirect } from "expo-router";

/**
 * Horarios (Schedules) index page
 * Redirects to the list view as the default page for this section
 */
export default function HorariosIndex() {
  return <Redirect href="/(tabs)/recursos-humanos/horarios/listar" />;
}
