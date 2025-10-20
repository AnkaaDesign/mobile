import { useEffect } from "react";
import { router } from "expo-router";

export default function ServiceOrdersScreen() {
  useEffect(() => {
    // Redirect to service orders list page
    router.replace("/(tabs)/production/service-orders/list");
  }, []);

  return null;
}
