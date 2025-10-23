import { useEffect } from "react";
import { router } from "expo-router";

export default function ProductionListScreen() {
  useEffect(() => {
    // Redirect to productions list page
    router.replace("/(tabs)/painting/productions/list");
  }, []);

  return null;
}
