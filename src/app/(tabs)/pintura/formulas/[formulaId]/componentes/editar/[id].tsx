import { useMemo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import {
  usePaintFormulaComponent,
  usePaintFormulaComponentMutations,
  useItems,
} from "@/hooks";
import {
  paintFormulaComponentUpdateSchema,
  type PaintFormulaComponentUpdateFormData,
} from "@/schemas";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { IconPercentage, IconWeight, IconPackage, IconEdit } from "@tabler/icons-react-native";

export default function EditComponentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditComponentScreenInner key={id} />;
}

function EditComponentScreenInner() {
  const { colors } = useTheme();
  const { id, formulaId } = useLocalSearchParams<{ formulaId: string; id: string }>();
  const { updateAsync } = usePaintFormulaComponentMutations();

  const componentQuery = usePaintFormulaComponent(id!, {
    include: { item: { include: { brands: true, category: true } } },
  });

  const component = componentQuery.data;

  const { data: itemsData, isLoading: isLoadingItems } = useItems({
    perPage: 100,
    include: { brands: true, category: true },
    orderBy: { name: "asc" },
  });

  const itemOptions = useMemo(() => {
    if (!itemsData?.data) return [];
    return itemsData.data.map((item) => ({
      value: item.id,
      label: item.uniCode ? `${item.name} (${item.uniCode})` : item.name,
      description: item.brands?.map((b) => b.name).join(", ") || item.category?.name || undefined,
    }));
  }, [itemsData]);

  const form = useForm<PaintFormulaComponentUpdateFormData>({
    resolver: zodResolver(paintFormulaComponentUpdateSchema),
    defaultValues: {
      itemId: "",
      weight: 1.0,
    },
  });

  // Hydrate form once the component data arrives.
  useEffect(() => {
    if (component?.data) {
      form.reset({
        itemId: component.data.itemId,
        weight: component.data.weight ?? component.data.weightInGrams,
      });
    }
  }, [component, form]);

  const flow = useFormFlow<PaintFormulaComponentUpdateFormData, any>({
    form,
    mutation: async (data) => updateAsync({ id: id!, data }),
    successRoute: () => mobileRoute(routes.painting.formulas.details(formulaId!)),
    successAction: "replace",
    cancelFallback: mobileRoute(routes.painting.formulas.details(formulaId!)),
  });

  const {
    control,
    watch,
    formState: { errors },
  } = form;

  const selectedItemId = watch("itemId");
  const selectedItem = useMemo(() => {
    if (!selectedItemId || !itemsData?.data) return null;
    return itemsData.data.find((item) => item.id === selectedItemId);
  }, [selectedItemId, itemsData]);

  return (
    <FormScreen
      title="Editar Componente"
      subtitle="Altere o item ou o peso do componente na fórmula"
      mode="edit"
      form={form}
      flow={flow}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      loadQuery={componentQuery as any}
      submitLabel="Salvar Alterações"
      submittingLabel="Salvando..."
    >
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <IconEdit size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Editar Componente</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Altere o item ou o peso do componente na fórmula
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Current Component Info */}
      {component?.data?.item && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Componente Atual</ThemedText>
            </View>
          </View>
          <View style={styles.currentComponentInfo}>
            <ThemedText style={styles.currentItemName}>{component.data.item.name}</ThemedText>
            {component.data.item.uniCode && (
              <ThemedText style={styles.currentItemCode}>
                Código: {component.data.item.uniCode}
              </ThemedText>
            )}
            <View style={styles.currentRatioContainer}>
              <IconPercentage size={16} color={colors.primary} />
              <ThemedText style={styles.currentRatio}>
                {component.data.ratio.toFixed(2)}%
              </ThemedText>
            </View>
          </View>
        </Card>
      )}

      {/* Item Selection */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Alterar Item</ThemedText>
          </View>
        </View>

        <Controller
          control={control}
          name="itemId"
          render={({ field: { onChange, value } }) => (
            <Combobox
              options={itemOptions}
              value={value || ""}
              onValueChange={onChange}
              placeholder="Selecione um item..."
              searchPlaceholder="Buscar itens..."
              emptyText="Nenhum item encontrado"
              loading={isLoadingItems}
              error={errors.itemId?.message}
            />
          )}
        />

        {selectedItem && selectedItem.id !== component?.data?.itemId && (
          <View style={styles.selectedItemPreview}>
            <View style={styles.previewHeader}>
              <ThemedText style={styles.previewTitle}>Novo Item Selecionado</ThemedText>
            </View>
            <View style={styles.previewContent}>
              <ThemedText style={styles.itemName}>{selectedItem.name}</ThemedText>
              {selectedItem.uniCode && (
                <ThemedText style={styles.itemCode}>Código: {selectedItem.uniCode}</ThemedText>
              )}
              {selectedItem.category?.description && (
                <ThemedText style={styles.itemDescription}>
                  {selectedItem.category.description}
                </ThemedText>
              )}
              <View style={styles.itemMeta}>
                {selectedItem.brands && selectedItem.brands.length > 0 && (
                  <ThemedText style={styles.metaText}>
                    Marca: {selectedItem.brands.map((b) => b.name).join(", ")}
                  </ThemedText>
                )}
                {selectedItem.category && (
                  <ThemedText style={styles.metaText}>
                    Categoria: {selectedItem.category.name}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Weight */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconWeight size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Alterar Peso</ThemedText>
          </View>
        </View>

        <Controller
          control={control}
          name="weight"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Label style={styles.fieldLabel}>Peso (g)</Label>
              <ThemedText style={styles.fieldHelperText}>
                Insira o novo peso deste componente na fórmula em gramas
              </ThemedText>
              <NumberInput
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Ex: 15.5"
                min={0.1}
                step={0.1}
                decimalPlaces={1}
                error={!!errors.weight}
              />
              {errors.weight && (
                <ThemedText style={styles.fieldErrorText}>{errors.weight.message}</ThemedText>
              )}
            </View>
          )}
        />
      </Card>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
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
  currentComponentInfo: {
    gap: spacing.xs,
  },
  currentItemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  currentItemCode: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  currentRatioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  currentRatio: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  selectedItemPreview: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "rgba(0, 122, 255, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.2)",
  },
  previewHeader: {
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    opacity: 0.8,
  },
  previewContent: {
    gap: spacing.xs,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  itemCode: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  itemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  ratioHelper: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "rgba(52, 199, 89, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.2)",
  },
  helperTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  fieldHelperText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  fieldErrorText: {
    fontSize: fontSize.xs,
    color: "#FF3B30",
    marginTop: spacing.xs,
  },
});
