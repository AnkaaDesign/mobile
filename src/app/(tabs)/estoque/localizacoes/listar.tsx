import { ThemedView } from "@/components/ui/themed-view";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { WarehouseMapView } from "@/components/inventory/warehouse-location/map/warehouse-map-view";

export default function WarehouseLocationsScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}>
      <WarehouseLocationsScreenInner />
    </PrivilegeGate>
  );
}

function WarehouseLocationsScreenInner() {
  useScreenReady();
  return (
    <ThemedView style={{ flex: 1 }}>
      <WarehouseMapView />
    </ThemedView>
  );
}
