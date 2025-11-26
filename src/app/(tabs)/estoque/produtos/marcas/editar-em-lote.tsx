import { useState, useMemo, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconTag, IconDeviceFloppy, IconAlertCircle } from "@tabler/icons-react-native";
import { useItemBrands, useItemBrandBatchMutations, useItems } from "@/hooks";
import type { ItemBrand } from "@/types";

import { ThemedView, ThemedText, Button, LoadingScreen, TextInput } from "@/components/ui";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import { toast } from "@/lib/toast";

interface BrandFormData {
  id: string;
  name: string;
  itemIds: string[];
}

export default function BrandBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandData, setBrandData] = useState<BrandFormData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Get brand IDs from URL params
  const brandIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch brands to edit
  const {
    data: brandsResponse,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useItemBrands(
    {
      where: {
        id: { in: brandIds },
      },
      include: {
        items: {
          include: {
            brand: true,
            category: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    },
    {
      enabled: brandIds.length > 0,
    }
  );

  // Fetch all items for the multi-select
  const {
    data: itemsResponse,
    isLoading: isItemsLoading,
  } = useItems({
    include: {
      brand: true,
      category: true,
    },
    orderBy: { name: "asc" },
    limit: 1000, // Get a large set of items
    searchingFor: searchQuery || undefined,
  });

  const { batchUpdateAsync: batchUpdate } = useItemBrandBatchMutations();

  const brands = brandsResponse?.data || [];
  const items = itemsResponse?.data || [];
  const hasValidBrands = brands.length > 0;
  const allBrandsFound = brands.length === brandIds.length;

  // Initialize brand data when brands are loaded
  useEffect(() => {
    if (brands.length > 0 && brandData.length === 0) {
      setBrandData(
        brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          itemIds: brand.items?.map((item) => item.id) || [],
        }))
      );
    }
  }, [brands, brandData.length]);

  // Convert items to multi-select options
  const itemOptions = useMemo(() => {
    return items.map((item) => ({
      value: item.id,
      label: `${item.name}${item.uniCode ? ` (${item.uniCode})` : ""}`,
    }));
  }, [items]);

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.inventory.products.brands.root) as any);
  };

  const handleSubmit = async () => {
    // Validate that all brands have names
    const invalidBrands = brandData.filter((brand) => !brand.name || brand.name.trim() === "");
    if (invalidBrands.length > 0) {
      toast.error("Todos os nomes de marcas devem ser preenchidos");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatePayload = {
        itemBrands: brandData.map((brand) => ({
          id: brand.id,
          data: {
            name: brand.name.trim(),
            itemIds: brand.itemIds,
          },
        })),
      };

      const result = await batchUpdate(updatePayload);

      if (result.data) {
        toast.success(
          `${result.data.totalSuccess} marca${result.data.totalSuccess !== 1 ? "s" : ""} atualizada${
            result.data.totalSuccess !== 1 ? "s" : ""
          } com sucesso`
        );

        if (result.data.totalFailed > 0) {
          toast.error(
            `${result.data.totalFailed} marca${result.data.totalFailed !== 1 ? "s" : ""} falhou ao atualizar`
          );
        }

        if (result.data.totalFailed === 0) {
          router.push(routeToMobilePath(routes.inventory.products.brands.root) as any);
        }
      }
    } catch (error) {
      toast.error("Erro ao atualizar marcas");
      console.error("Error updating brands:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrandNameChange = (index: number, name: string) => {
    setBrandData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name };
      return updated;
    });
  };

  const handleBrandItemsChange = (index: number, itemIds: string[]) => {
    setBrandData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], itemIds };
      return updated;
    });
  };

  if (brandIds.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconTag size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhuma Marca Selecionada
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Nenhuma marca foi selecionada para edição em lote.
          </ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.button}>
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isBrandsLoading || isItemsLoading) {
    return <LoadingScreen message="Carregando marcas..." />;
  }

  if (brandsError || !hasValidBrands) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconAlertCircle size={48} color={colors.destructive} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Erro ao Carregar Marcas
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            {brandsError
              ? "Ocorreu um erro ao carregar as marcas selecionadas."
              : "As marcas selecionadas não foram encontradas."}
          </ThemedText>
          {!allBrandsFound && brands.length > 0 && (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: colors.warning + "20", borderColor: colors.warning },
              ]}
            >
              <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                Apenas {brands.length} de {brandIds.length} marcas foram encontradas. As marcas não
                encontradas podem ter sido excluídas.
              </ThemedText>
            </View>
          )}
          <Button variant="outline" onPress={handleCancel} style={styles.button}>
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Editar Marcas em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {brands.length} marca{brands.length !== 1 ? "s" : ""} selecionada
            {brands.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.muted + "40", borderColor: colors.border }]}>
          <View style={styles.infoContent}>
            <IconAlertCircle size={20} color={colors.primary} />
            <ThemedText style={[styles.infoText, { color: colors.foreground }]}>
              As alterações serão aplicadas a todas as marcas listadas abaixo
            </ThemedText>
          </View>
        </View>

        {/* Brands Edit Form */}
        {brandData.map((brand, index) => {
          const originalBrand = brands.find((b) => b.id === brand.id);
          const itemCount = (originalBrand as any)?._count?.items || 0;

          return (
            <View
              key={brand.id}
              style={[styles.brandCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.brandHeader}>
                <ThemedText style={[styles.brandTitle, { color: colors.foreground }]}>
                  Marca {index + 1}
                </ThemedText>
                {itemCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
                      {itemCount} {itemCount === 1 ? "produto" : "produtos"}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Brand Name Input */}
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Nome da Marca <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  value={brand.name}
                  onChangeText={(text) => handleBrandNameChange(index, text)}
                  placeholder="Digite o nome da marca"
                  editable={!isSubmitting}
                  inputStyle={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />
              </View>

              {/* Associated Items Multi-Select */}
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Produtos Associados
                </ThemedText>
                <MultiSelect
                  options={itemOptions}
                  selectedValues={brand.itemIds}
                  onValuesChange={(values) => handleBrandItemsChange(index, values)}
                  placeholder="Selecione os produtos desta marca"
                  disabled={isSubmitting}
                  searchable={true}
                />
                <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                  {brand.itemIds.length} produto{brand.itemIds.length !== 1 ? "s" : ""} selecionado
                  {brand.itemIds.length !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={isSubmitting || brandData.length === 0}
            icon={
              isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              )
            }
            style={styles.footerButton}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 120,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  brandCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  warningCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
  },
});
