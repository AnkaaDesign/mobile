import { useEffect } from "react";
import { router } from "expo-router";

export default function PaintsScreen() {
  useEffect(() => {
    // Redirect to painting catalog list page - consolidating all paint management
    router.replace("/(tabs)/painting/catalog");
  }, []);

  return null;
}
