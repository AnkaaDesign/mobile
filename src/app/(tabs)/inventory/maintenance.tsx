import { useEffect } from "react";
import { router } from "expo-router";

export default function InventoryMaintenanceScreen() {
  useEffect(() => {
    // Redirect to maintenance list page
    router.replace("/(tabs)/inventory/maintenance/list");
  }, []);

  return null;
}
