import { useEffect } from "react";
import { router } from "expo-router";

export default function SuppliersScreen() {
  useEffect(() => {
    // Redirect to suppliers list page
    router.replace("/(tabs)/inventory/suppliers/list");
  }, []);

  return null;
}
