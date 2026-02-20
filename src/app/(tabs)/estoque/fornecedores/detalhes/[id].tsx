import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSupplierDetail, useSupplierMutations, useScreenReady} from '@/hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

import {
  IconBuilding,
  IconEdit,
  IconTrash,
  IconHistory,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/utils/route-mapper";
import { TouchableOpacity } from "react-native";
// import { showToast } from "@/components/ui/toast";

import {
  BasicInfoCard,
  ContactDetailsCard,
  AddressInfoCard,
  ItemsTable,
  OrdersTable,
} from "@/components/inventory/supplier/detail";
import { SupplierDetailSkeleton } from "@/components/inventory/supplier/skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { RoutePrivilegeGuard } from "@/components/navigation/route-privilege-guard";
import { FileViewerProvider } from "@/components/file";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ActivityIndicator } from "@/components/ui/activity-indicator";

export default function SupplierDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useSupplierDetail(id, {
    include: {
      logo: true,
      items: {
        include: {
          brand: true,
          category: true,
        },
      },
      orders: {
        include: {
          items: true,
        },
      },
      orderRules: true,
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const supplier = response?.data;
  const { delete: deleteSupplier } = useSupplierMutations();

  const handleEdit = () => {
    if (supplier) {
      router.push(routeToMobilePath(routes.inventory.suppliers.edit(supplier.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  const handleDelete = async () => {
    try {
      await deleteSupplier.mutateAsync(id);
      Alert.alert("Sucesso", "Fornecedor excluído com sucesso");
      router.replace(routes.inventory.suppliers.root as any);
    } catch (_error) {
      // API client already shows error alert
    }
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <RoutePrivilegeGuard>
        <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <SupplierDetailSkeleton />
          </View>
        </View>
      </RoutePrivilegeGuard>
    );
  }

  if (error || !supplier || !id || id === "") {
    return (
      <RoutePrivilegeGuard>
        <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <Card style={styles.card}>
              <View style={styles.errorContent}>
                <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                  <IconBuilding size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                  Fornecedor não encontrado
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                  O fornecedor solicitado não foi encontrado ou pode ter sido removido.
                </ThemedText>
                <Button onPress={() => router.back()}>
                  <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
                </Button>
              </View>
            </Card>
          </View>
        </View>
      </RoutePrivilegeGuard>
    );
  }

  return (
    <RoutePrivilegeGuard>
      <FileViewerProvider>
        <ScrollView
          style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Supplier Name Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerContent}>
                <View style={[styles.headerLeft, { flex: 1 }]}>
                  <IconBuilding size={24} color={colors.primary} />
                  <ThemedText style={StyleSheet.flatten([styles.supplierName, { color: colors.foreground }])}>
                    {supplier.fantasyName}
                  </ThemedText>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    onPress={handleEdit}
                    style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                    activeOpacity={0.7}
                  >
                    <IconEdit size={18} color={colors.primaryForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsDeleteDialogOpen(true)}
                    style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                    activeOpacity={0.7}
                  >
                    <IconTrash size={18} color={colors.destructiveForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Modular Components */}
            <BasicInfoCard supplier={supplier} />
            <ContactDetailsCard supplier={supplier} />
            <AddressInfoCard supplier={supplier} />

            {/* Items Table */}
            <ItemsTable supplier={supplier} maxHeight={500} />

            {/* Orders Table */}
            <OrdersTable supplier={supplier} maxHeight={400} />

            {/* Changelog Timeline */}
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
                  entityName={supplier.fantasyName}
                  entityCreatedAt={supplier.createdAt}
                  maxHeight={400}
                />
              </View>
            </Card>

            {/* Bottom spacing */}
            <View style={{ height: spacing.md }} />
          </View>
        </ScrollView>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <View style={styles.deleteDialogTitle}>
                  <IconAlertTriangle size={20} color={colors.destructive} />
                  <ThemedText style={styles.deleteDialogTitleText}>Confirmar Exclusão</ThemedText>
                </View>
              </AlertDialogTitle>
              <AlertDialogDescription>
                <ThemedText>Tem certeza que deseja excluir o fornecedor "{supplier.fantasyName}"?</ThemedText>
                {supplier._count?.items ? (
                  <ThemedText style={StyleSheet.flatten([styles.deleteWarning, { color: colors.destructive }])}>
                    Atenção: Este fornecedor possui {supplier._count.items} produto{supplier._count.items !== 1 ? "s" : ""} associado{supplier._count.items !== 1 ? "s" : ""}.
                  </ThemedText>
                ) : null}
                <ThemedText style={styles.deleteDisclaimer}>Esta ação não poderá ser desfeita.</ThemedText>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <ThemedText>Cancelar</ThemedText>
              </AlertDialogCancel>
              <AlertDialogAction
                onPress={handleDelete}
                disabled={deleteSupplier.isPending}
                className="bg-destructive"
              >
                {deleteSupplier.isPending ? (
                  <View style={styles.deleteButtonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <ThemedText style={{ color: "#ffffff" }}>Excluindo...</ThemedText>
                  </View>
                ) : (
                  <View style={styles.deleteButtonContent}>
                    <IconTrash size={16} color="#ffffff" />
                    <ThemedText style={{ color: "#ffffff" }}>Excluir</ThemedText>
                  </View>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FileViewerProvider>
    </RoutePrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  supplierName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  deleteDialogTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deleteDialogTitleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  deleteWarning: {
    marginTop: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  deleteDisclaimer: {
    marginTop: spacing.sm,
  },
  deleteButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
