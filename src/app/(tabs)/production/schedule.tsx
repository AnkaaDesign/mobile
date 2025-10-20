import { useEffect } from "react";
import { router } from "expo-router";

export default function ScheduleListScreen() {
  useEffect(() => {
    // Redirect to schedule list page
    router.replace("/(tabs)/production/schedule/list");
  }, []);

  return null;
}
