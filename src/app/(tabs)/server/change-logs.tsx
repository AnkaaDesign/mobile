import { useEffect } from "react";
import { router } from "expo-router";

export default function AdministrationChangeLogsScreen() {
  useEffect(() => {
    // Redirect to change logs list page
    router.replace("/(tabs)/administration/change-logs/list");
  }, []);

  return null;
}
