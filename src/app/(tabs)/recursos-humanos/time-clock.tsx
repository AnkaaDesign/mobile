import { Redirect } from "expo-router";

// Redirect to Secullum time entries (time clock)
export default function HumanResourcesTimeClockScreen() {
  return <Redirect href="/(tabs)/integrations/secullum/time-entries/list" />;
}
