import { ThemedView } from "@/components/ui/themed-view";
import { StockBalanceBatchCreateForm } from "@/components/inventory/stock-balance/form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function StockBalanceScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <StockBalanceScreenInner />
    </PrivilegeGate>
  );
}

function StockBalanceScreenInner() {
  const nav = useNav();
  useScreenReady();

  const handleCancel = () => {
    nav.replace(mobileRoute(routes.inventory.products.list));
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <StockBalanceBatchCreateForm onCancel={handleCancel} />
    </ThemedView>
  );
}
