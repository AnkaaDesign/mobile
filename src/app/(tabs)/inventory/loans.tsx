import { useEffect } from "react";
import { router } from "expo-router";

export default function InventoryLoansScreen() {
  useEffect(() => {
    // Redirect to loans list page
    router.replace("/(tabs)/inventory/loans/list");
  }, []);

  return null;
}
