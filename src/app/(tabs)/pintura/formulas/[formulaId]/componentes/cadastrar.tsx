import { useMemo } from "react";
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
import { usePaintFormulaComponentMutations, useItems } from "@/hooks";
import {
  paintFormulaComponentCreateSchema,
  type PaintFormulaComponentCreateFormData,
} from "@/schemas";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";
import { IconWeight, IconPackage, IconPlus } from "@tabler/icons-react-native";

export default function CreateComponentScreen() {
  const { colors } = useTheme();
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>();
  const { createAsync } = usePaintFormulaComponentMutations();

  // Fetch available items for selection
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

  const form = useForm<PaintFormulaComponentCreateFormData>({
    resolver: zodResolver(paintFormulaComponentCreateSchema),
    defaultValues: {
      formulaPaintId: formulaId!,
      itemId: "",
      weight: 1.0,
    },
  });

  const flow = useFormFlow<PaintFormulaComponentCreateFormData, any>({
    form,
    mutation: async (data) => createAsync(data),
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
      title="Adicionar Componente"
      subtitle="Adicione um item à fórmula com seu respectivo peso"
      mode="create"
      form={form}
      flow={flow}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      submitLabel="Adicionar Componente"
      submittingLabel="Adicionando..."
    >
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <IconPlus size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Novo Componente</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Adicione um item à fórmula com seu respectivo peso
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Item Selection */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Selecionar Item</ThemedText>
          </View>
        </View>

        <Controller
          control={control}
          name="itemId"
          render={({ field: { onChange, value } }) => (
            <Combobox
              options={itemOptions}
              value={value}
              onValueChange={onChange}
              placeholder="Selecione um item..."
              searchPlaceholder="Buscar itens..."
              emptyText="Nenhum item encontrado"
              loading={isLoadingItems}
              error={errors.itemId?.message}
            />
          )}
        />

        {selectedItem && (
          <View style={styles.selectedItemPreview}>
            <View style={styles.previewHeader}>
              <ThemedText style={styles.previewTitle}>Item Selecionado</ThemedText>
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

      {/* Weight Input */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconWeight size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Peso</ThemedText>
          </View>
        </View>

        <Controller
          control={control}
          name="weight"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Label style={styles.fieldLabel}>Peso (g)</Label>
              <ThemedText style={styles.fieldHelperText}>
                Insira o peso deste componente na fórmula em gramas
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
