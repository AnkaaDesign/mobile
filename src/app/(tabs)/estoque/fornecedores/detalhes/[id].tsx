import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconBuilding, IconHistory } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import { FileViewerProvider } from "@/components/file";
import { useTheme } from "@/lib/theme";
import { useSupplierDetail, useSupplierMutations } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import {
  BasicInfoCard,
  ContactDetailsCard,
  AddressInfoCard,
  ItemsTable,
  OrdersTable,
} from "@/components/inventory/supplier/detail";
import type { Supplier } from "@/types";

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { delete: deleteSupplier } = useSupplierMutations();

  const query = useSupplierDetail(id as string, {
    include: {
      logo: true,
      items: { include: { brands: true, category: true } },
      orders: { include: { items: true } },
      orderRules: true,
    },
    enabled: !!id && id !== "",
  });

  return (
    <FileViewerProvider>
      <DetailScreen<Supplier>
        query={query as any}
        icon={IconBuilding}
        title={(s) => s.fantasyName ?? s.corporateName ?? "Fornecedor"}
        privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
        editRoute={(s) => mobileRoute(routes.inventory.suppliers.edit(s.id))}
        deleteAction={{
          mutation: deleteSupplier,
          confirmText:
            "Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.",
          successRoute: mobileRoute(routes.inventory.suppliers.root),
        }}
        notFoundFallback={mobileRoute(routes.inventory.suppliers.root)}
      >
        {(supplier) => (
          <View style={styles.body}>
            <BasicInfoCard supplier={supplier} />
            <ContactDetailsCard supplier={supplier} />
            <AddressInfoCard supplier={supplier} />
            <ItemsTable supplier={supplier} maxHeight={500} />
            <OrdersTable supplier={supplier} maxHeight={400} />

            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconHistory size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <ChangelogTimeline
                  entityType={CHANGE_LOG_ENTITY_TYPE.SUPPLIER}
                  entityId={supplier.id}
                  entityName={supplier.fantasyName ?? supplier.corporateName ?? ""}
                  entityCreatedAt={supplier.createdAt}
                  maxHeight={400}
                />
              </View>
            </Card>
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
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  content: {
    gap: spacing.sm,
  },
});
