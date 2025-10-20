import { useEffect } from "react";
import { router } from "expo-router";

export default function InventoryExternalWithdrawalsScreen() {
  useEffect(() => {
    // Redirect to external withdrawals list page
    router.replace("/(tabs)/inventory/external-withdrawals/list");
  }, []);

  return null;
}
