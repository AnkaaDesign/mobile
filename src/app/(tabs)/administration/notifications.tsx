import { useEffect } from "react";
import { router } from "expo-router";

export default function ListNotificationsScreen() {
  useEffect(() => {
    // Redirect to notifications list page
    router.replace("/(tabs)/administration/notifications/list");
  }, []);

  return null;
}
