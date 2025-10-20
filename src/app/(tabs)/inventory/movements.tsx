import { useEffect } from "react";
import { router } from "expo-router";

export default function MovementsScreen() {
  useEffect(() => {
    // Redirect to activities list since movements and activities are the same
    router.replace("/(tabs)/inventory/activities/list");
  }, []);

  return null;
}
