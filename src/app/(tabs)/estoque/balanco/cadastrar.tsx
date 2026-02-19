import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { StockBalanceBatchCreateForm } from "@/components/inventory/stock-balance/form";
import { routeToMobilePath } from "@/utils/route-mapper";
import { routes } from "@/constants";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function StockBalanceCreateScreen() {
  useScreenReady();
  const router = useRouter();

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.list) as any);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <StockBalanceBatchCreateForm onCancel={handleCancel} />
    </ThemedView>
  );
}
