import { useEffect } from "react";
import { router } from "expo-router";

export default function HumanResourcesPositionsScreen() {
  useEffect(() => {
    // Redirect to positions list page
    router.replace("/(tabs)/human-resources/positions/list");
  }, []);

  return null;
}
