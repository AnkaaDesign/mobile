import { useEffect } from "react";
import { router } from "expo-router";

export default function MaintenanceSchedulesScreen() {
  useEffect(() => {
    // Redirect to schedules list page
    router.replace("/(tabs)/inventory/maintenance/schedules/list");
  }, []);

  return null;
}
