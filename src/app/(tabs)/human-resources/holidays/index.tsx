import { useEffect } from "react";
import { router } from "expo-router";

export default function HumanResourcesHolidaysScreen() {
  useEffect(() => {
    // Redirect to holidays list page
    router.replace("/(tabs)/human-resources/holidays/list");
  }, []);

  return null;
}
