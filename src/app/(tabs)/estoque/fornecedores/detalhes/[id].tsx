import { useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { useSupplierDetail, useSupplierMutations } from "@/hooks";
import { useTheme } from "@/lib/theme";

import { RoutePrivilegeGuard } from "@/components/navigation/route-privilege-guard";
import { PageHeader } from "@/components/ui/page-header";
import { BasicInfoCard, ContactDetailsCard, AddressInfoCard, RelatedItemsCard, RelatedOrdersCard, DocumentsCard } from "@/components/inventory/supplier/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { FileViewerProvider } from "@/components/file";
import { toast } from "@/lib/toast";

export default function SupplierDetailsScreen() {
  // TODO: Implement usePageTracker hook for analytics
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useSupplierDetail(id || "", {
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
    enabled: !!id,
  });

  const supplier = response?.data;
  const { delete: deleteSupplier } = useSupplierMutations();

  if (!id) {
    router.replace(routes.inventory.suppliers.root as any);
    return null;
  }

  if (error) {
    return (
      <View className="flex flex-col items-center justify-center h-full p-4">
        <Icon name="alert-triangle" size={48} className="text-destructive mb-4" />
        <Text className="text-destructive mb-4">Erro ao carregar fornecedor</Text>
        <Button onPress={() => router.replace(routes.inventory.suppliers.root as any)}>
          <Text>Voltar para lista</Text>
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex items-center justify-center h-full">
        <ActivityIndicator size="large" color={colors.mutedForeground} />
      </View>
    );
  }

  if (!supplier) {
    router.replace(routes.inventory.suppliers.root as any);
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success("Fornecedor excluído com sucesso");
      router.replace(routes.inventory.suppliers.root as any);
    } catch (error) {
      toast.error("Erro ao excluir fornecedor");
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <RoutePrivilegeGuard>
      <FileViewerProvider>
        <View className="flex flex-col h-full">
          <PageHeader
            variant="detail"
            title={supplier.fantasyName}
            icon="building"
            breadcrumbs={[
              { label: "Início", onPress: () => router.push("/") },
              { label: "Estoque" },
              { label: "Fornecedores", onPress: () => router.push(routes.inventory.suppliers.root) },
              { label: supplier.fantasyName }
            ]}
            actions={[
              {
                key: "refresh",
                label: "Atualizar",
                icon: "refresh",
                onPress: () => refetch(),
                loading: isRefetching,
              },
              {
                key: "edit",
                label: "Editar",
                icon: "edit",
                onPress: () => router.push(routes.inventory.suppliers.edit(id) as any),
              },
              {
                key: "delete",
                label: "Excluir",
                icon: "trash",
                onPress: () => setIsDeleteDialogOpen(true),
              },
            ]}
          />

          <ScrollView className="flex-1 p-4">
            <View className="space-y-6">
              {/* Core Information Grid */}
              <View className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BasicInfoCard supplier={supplier} />
                <ContactDetailsCard supplier={supplier} />
              </View>

              {/* Address and Changelog Grid */}
              <View className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AddressInfoCard supplier={supplier} />
                <ChangelogTimeline entityType={CHANGE_LOG_ENTITY_TYPE.SUPPLIER} entityId={id} maxHeight={500} />
              </View>

              {/* Documents Grid */}
              <View className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocumentsCard supplier={supplier} />
              </View>

              {/* Related Orders */}
              <RelatedOrdersCard supplier={supplier} />

              {/* Related Items - Full Width, Last Section */}
              <RelatedItemsCard items={supplier.items} supplierId={supplier.id} />
            </View>
          </ScrollView>

          {/* Delete Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Icon name="alert-triangle" size={20} className="text-destructive" />
                  <Text>Confirmar Exclusão</Text>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <Text>Tem certeza que deseja excluir o fornecedor "{supplier.fantasyName}"?</Text>
                  {supplier._count?.items ? (
                    <Text className="block mt-2 font-medium text-destructive">
                      Atenção: Este fornecedor possui {supplier._count.items} produto{supplier._count.items !== 1 ? "s" : ""} associado{supplier._count.items !== 1 ? "s" : ""}.
                    </Text>
                  ) : null}
                  <Text className="mt-2">Esta ação não poderá ser desfeita.</Text>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text>Cancelar</Text>
                </AlertDialogCancel>
                <AlertDialogAction
                  onPress={handleDelete}
                  disabled={deleteSupplier.isPending}
                  className="bg-destructive"
                >
                  {deleteSupplier.isPending ? (
                    <View className="flex flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text className="text-white">Excluindo...</Text>
                    </View>
                  ) : (
                    <View className="flex flex-row items-center gap-2">
                      <Icon name="trash" size={16} className="text-white" />
                      <Text className="text-white">Excluir</Text>
                    </View>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </View>
      </FileViewerProvider>
    </RoutePrivilegeGuard>
  );
}
