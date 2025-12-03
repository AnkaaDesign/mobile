import { useState, useMemo, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconTag,
  IconDeviceFloppy,
  IconX,
  IconCheck,
  IconShield,
  IconTool,
  IconHelmet,
  IconBox
} from "@tabler/icons-react-native";
import { useItemCategories, useItemCategoryBatchMutations } from "@/hooks";
import type { ItemCategory } from "@/types";
import { ThemedView, ThemedText, Button, LoadingScreen, ErrorScreen, Input, Checkbox } from "@/components/ui";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/lib/theme";
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from "@/constants";
import { toast } from "@/lib/toast";

interface CategoryEditData {
  id: string;
  name: string;
  type: ITEM_CATEGORY_TYPE;
  selected: boolean;
}

export default function CategoryBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryEditData[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // Get selected IDs from URL params
  const selectedIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch selected categories
  const {
    data: categoriesData,
    isLoading,
    error,
  } = useItemCategories({
    where: {
      id: { in: selectedIds },
    },
    include: {
      items: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
    enabled: selectedIds.length > 0,
  });

  const { batchUpdateAsync: batchUpdate } = useItemCategoryBatchMutations();

  // Initialize categories state from fetched data
  useEffect(() => {
    if (categoriesData?.data) {
      const initialCategories: CategoryEditData[] = categoriesData.data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        selected: true,
      }));
      setCategories(initialCategories);
    }
  }, [categoriesData]);

  // Redirect if no IDs provided
  useEffect(() => {
    if (selectedIds.length === 0) {
      router.back();
    }
  }, [selectedIds, router]);

  const handleCancel = () => {
    router.back();
  };

  const handleToggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, selected: !cat.selected } : cat))
    );
  };

  const handleToggleAll = () => {
    const allSelected = categories.every((cat) => cat.selected);
    setCategories((prev) => prev.map((cat) => ({ ...cat, selected: !allSelected })));
  };

  const handleNameChange = (id: string, name: string | number | null) => {
    const nameStr = name?.toString() || "";
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: nameStr } : cat))
    );
  };

  const handleTypeChange = (id: string, type: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, type: type as ITEM_CATEGORY_TYPE } : cat))
    );
  };

  const validateCategories = (): boolean => {
    const selectedCategories = categories.filter((cat) => cat.selected);

    if (selectedCategories.length === 0) {
      toast.error("Selecione pelo menos uma categoria para atualizar");
      return false;
    }

    const hasEmptyName = selectedCategories.some((cat) => !cat.name.trim());
    if (hasEmptyName) {
      toast.error("Todas as categorias selecionadas devem ter um nome");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    if (!validateCategories()) {
      return;
    }

    const selectedCategories = categories.filter((cat) => cat.selected);

    Alert.alert(
      "Confirmar Alterações",
      `Deseja atualizar ${selectedCategories.length} ${selectedCategories.length === 1 ? "categoria" : "categorias"}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const updateData = {
                itemCategories: selectedCategories.map((cat) => ({
                  id: cat.id,
                  data: {
                    name: cat.name,
                    type: cat.type,
                  },
                })),
              };

              const result = await batchUpdate(updateData);

              if (result.data) {
                const { totalSuccess = 0, totalFailed = 0 } = result.data;

                if (totalSuccess > 0) {
                  toast.success(
                    `${totalSuccess} ${totalSuccess === 1 ? "categoria atualizada" : "categorias atualizadas"} com sucesso`
                  );
                }

                if (totalFailed > 0) {
                  toast.error(
                    `${totalFailed} ${totalFailed === 1 ? "categoria falhou" : "categorias falharam"} ao atualizar`
                  );
                }

                if (totalFailed === 0) {
                  router.back();
                }
              }
            } catch (error) {
              toast.error("Erro ao atualizar categorias em lote");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (type: ITEM_CATEGORY_TYPE) => {
    const iconProps = { size: 18, color: colors.mutedForeground };
    switch (type) {
      case ITEM_CATEGORY_TYPE.PPE:
        return <IconHelmet {...iconProps} />;
      case ITEM_CATEGORY_TYPE.TOOL:
        return <IconTool {...iconProps} />;
      case ITEM_CATEGORY_TYPE.REGULAR:
      default:
        return <IconBox {...iconProps} />;
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando categorias..." />;
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorScreen
          message="Erro ao carregar categorias"
          detail="Não foi possível carregar as categorias selecionadas. Por favor, tente novamente."
          onRetry={() => router.back()}
        />
      </ThemedView>
    );
  }

  if (selectedIds.length === 0 || categories.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconTag size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhuma categoria selecionada
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Por favor, selecione pelo menos uma categoria para editar em lote.
          </ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.button}>
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  const selectedCount = categories.filter((cat) => cat.selected).length;
  const allSelected = categories.every((cat) => cat.selected);

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Editar Categorias em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {selectedCount} de {categories.length}{" "}
            {categories.length === 1 ? "categoria selecionada" : "categorias selecionadas"}
          </ThemedText>
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <View style={styles.infoIconContainer}>
            <IconShield size={16} color={colors.primary} />
          </View>
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Edite os campos das categorias abaixo. As alterações serão aplicadas apenas às
            categorias marcadas.
          </ThemedText>
        </View>

        {/* Select All Toggle */}
        <TouchableOpacity
          style={[styles.selectAllCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleToggleAll}
          activeOpacity={0.7}
        >
          <View style={styles.selectAllContent}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleToggleAll}
              disabled={isSubmitting}
            />
            <ThemedText style={[styles.selectAllText, { color: colors.foreground }]}>
              {allSelected ? "Desmarcar todas" : "Selecionar todas"}
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Categories List */}
        <View style={styles.categoriesList}>
          {categories.map((category, index) => {
            const itemCount =
              categoriesData?.data?.find((c) => c.id === category.id)?._count?.items || 0;

            return (
              <View
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  category.selected && styles.categoryCardSelected,
                  category.selected && { borderColor: colors.primary },
                ]}
              >
                {/* Category Header */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => handleToggleCategory(category.id)}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Checkbox
                      checked={category.selected}
                      onCheckedChange={() => handleToggleCategory(category.id)}
                      disabled={isSubmitting}
                    />
                    <View style={styles.categoryInfo}>
                      <ThemedText
                        style={[styles.categoryNumber, { color: colors.mutedForeground }]}
                      >
                        Categoria {index + 1}
                      </ThemedText>
                      {itemCount > 0 && (
                        <ThemedText
                          style={[styles.categoryItemCount, { color: colors.mutedForeground }]}
                        >
                          {itemCount} {itemCount === 1 ? "produto" : "produtos"}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  {getCategoryIcon(category.type)}
                </TouchableOpacity>

                {/* Category Form Fields */}
                {category.selected && (
                  <View style={styles.categoryForm}>
                    <View style={styles.formGroup}>
                      <ThemedText style={[styles.label, { color: colors.foreground }]}>
                        Nome da Categoria
                      </ThemedText>
                      <Input
                        value={category.name}
                        onChangeText={(text) => handleNameChange(category.id, text)}
                        placeholder="Digite o nome da categoria"
                        disabled={isSubmitting}
                        style={[
                          styles.input,
                          showValidation &&
                            !category.name.trim() &&
                            styles.inputError,
                        ]}
                      />
                      {showValidation && !category.name.trim() && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          Nome é obrigatório
                        </ThemedText>
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <ThemedText style={[styles.label, { color: colors.foreground }]}>
                        Tipo
                      </ThemedText>
                      <Select
                        value={category.type}
                        onValueChange={(value) => handleTypeChange(category.id, value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(ITEM_CATEGORY_TYPE).map((type) => (
                              <SelectItem key={type} value={type} label={ITEM_CATEGORY_TYPE_LABELS[type]}>
                                {ITEM_CATEGORY_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            <IconX size={18} color={colors.foreground} />
            <ThemedText>Cancelar</ThemedText>
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={isSubmitting || selectedCount === 0}
            icon={
              isSubmitting ? undefined : (
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
    gap: 16,
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
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    minWidth: 120,
  },
  infoCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  selectAllCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  selectAllContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "500",
  },
  categoriesList: {
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: 8,
    borderWidth: 2,
    overflow: "hidden",
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNumber: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryItemCount: {
    fontSize: 12,
  },
  categoryForm: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: 44,
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: -4,
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
