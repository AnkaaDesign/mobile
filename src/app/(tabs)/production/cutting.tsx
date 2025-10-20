import { useEffect } from "react";
import { router } from "expo-router";

export default function ProductionCuttingScreen() {
  useEffect(() => {
    // Redirect to cutting list page
    router.replace("/(tabs)/production/cutting/list");
  }, []);

  return null;
}
