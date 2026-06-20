import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconMapPin } from "@tabler/icons-react-native";

import { DetailScreen } from "@/components/screens/detail-screen";
import { FileViewerProvider } from "@/components/file";
import { useWarehouseLocationDetail, useWarehouseLocationMutations } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { BasicInfoCard, ItemsTable } from "@/components/inventory/warehouse-location/detail";
import type { WarehouseLocation } from "@/types";

export default function WarehouseLocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { delete: deleteLocation } = useWarehouseLocationMutations();

  const query = useWarehouseLocationDetail(id as string, {
    include: {
      _count: { select: { items: true } },
    },
    enabled: !!id && id !== "",
  });

  return (
    <FileViewerProvider>
      <DetailScreen<WarehouseLocation>
        query={query as any}
        icon={IconMapPin}
        title={(l) => l.name ?? "Localização"}
        privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
        editRoute={(l) => mobileRoute(routes.inventory.warehouseLocations.edit(l.id))}
        deleteAction={{
          mutation: deleteLocation,
          confirmText:
            "Tem certeza que deseja excluir esta localização? Esta ação não pode ser desfeita.",
          successRoute: mobileRoute(routes.inventory.warehouseLocations.root),
        }}
        deletePrivilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
        notFoundFallback={mobileRoute(routes.inventory.warehouseLocations.root)}
      >
        {(location) => (
          <View style={styles.body}>
            <BasicInfoCard location={location} />
            <ItemsTable location={location} maxHeight={500} />
          </View>
        )}
      </DetailScreen>
    </FileViewerProvider>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
