import { useMemo } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormulaComponentMutations } from "@/hooks";
import { useItems } from "@/hooks";
import { paintFormulaComponentCreateSchema } from '../../../../../../schemas';
import type { PaintFormulaComponentCreateFormData } from '../../../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
import { showToast } from "@/lib/toast/use-toast";
import {
  IconFlask,
  IconPercentage,
  IconPackage,
  IconPlus,
} from "@tabler/icons-react-native";

export default function CreateComponentScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>();
  const { create: createComponent, isLoading } = usePaintFormulaComponentMutations();

  // Check permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch available items for selection
  const {
    data: itemsData,
    isLoading: isLoadingItems
  } = useItems({
    perPage: 100,
    include: {
      brand: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  // Transform items for combobox
  const itemOptions = useMemo(() => {
    if (!itemsData?.data) return [];

    return itemsData.data.map(item => ({
      value: item.id,
      label: item.uniCode ? `${item.name} (${item.uniCode})` : item.name,
      description: item.brand?.name || item.category?.name || undefined,
    }));
  }, [itemsData]);

  // Form setup
  const form = useForm<PaintFormulaComponentCreateFormData>({
    resolver: zodResolver(paintFormulaComponentCreateSchema),
    defaultValues: {
      formulaPaintId: formulaId!,
      itemId: "",
      ratio: 1.0,
    },
  });

  const { handleSubmit, control, formState: { errors, isValid }, watch} = form;

  // Watch selected item for display
  const selectedItemId = watch("itemId");
  const selectedItem = useMemo(() => {
    if (!selectedItemId || !itemsData?.data) return null;
    return itemsData.data.find(item => item.id === selectedItemId);
  }, [selectedItemId, itemsData]);

  // Handle form submission
  const onSubmit = async (data: PaintFormulaComponentCreateFormData) => {
    if (!canCreate) {
      showToast("Você não tem permissão para adicionar componentes", "error");
      return;
    }

    try {
      await createComponent(data);
      showToast("Componente adicionado com sucesso", "success");
      router.back();
    } catch (error: any) {
      showToast(error.message || "Erro ao adicionar componente", "error");
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    const formData = form.getValues();
    const hasChanges = formData.itemId || formData.ratio !== 1.0;

    if (hasChanges) {
      Alert.alert(
        "Descartar Alterações",
        "Você tem alterações não salvas. Deseja descartar?",
        [
          { text: "Continuar Editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  if (!canCreate) {
    return (
      <View style={styles.centerContainer}>
        <IconFlask size={48} color={colors.muted} />
        <ThemedText style={styles.permissionText}>
          Você não tem permissão para adicionar componentes
        </ThemedText>
        <Button variant="outline" onPress={() => router.back()}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Adicionar Componente",
          headerBackTitle: "Cancelar",
          headerLeft: () => (
            <Button variant="ghost" size="sm" onPress={handleCancel}>
              Cancelar
            </Button>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <IconPlus size={24} color={colors.primary} />
              <View style={styles.headerText}>
                <ThemedText style={styles.headerTitle}>Novo Componente</ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                  Adicione um item à fórmula com sua respectiva proporção
                </ThemedText>
              </View>
            </View>
          </Card>

          {/* Item Selection Card */}
          <Card style={styles.formCard}>
            <View style={styles.cardHeader}>
              <IconPackage size={20} color={colors.foreground} />
              <ThemedText style={styles.cardTitle}>Selecionar Item</ThemedText>
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

            {/* Selected Item Preview */}
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
                    <ThemedText style={styles.itemDescription}>{selectedItem.category.description}</ThemedText>
                  )}
                  <View style={styles.itemMeta}>
                    {selectedItem.brand && (
                      <ThemedText style={styles.metaText}>
                        Marca: {selectedItem.brand.name}
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

          {/* Ratio Input Card */}
          <Card style={styles.formCard}>
            <View style={styles.cardHeader}>
              <IconPercentage size={20} color={colors.foreground} />
              <ThemedText style={styles.cardTitle}>Proporção</ThemedText>
            </View>

            <Controller
              control={control}
              name="ratio"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Label style={styles.fieldLabel}>Proporção (%)</Label>
                  <ThemedText style={styles.fieldHelperText}>
                    Insira a proporção deste componente na fórmula (0.1% a 100%)
                  </ThemedText>
                  <NumberInput
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="Ex: 15.5"
                    min={0.1}
                    max={100}
                    step={0.1}
                    decimalPlaces={1}
                    error={!!errors.ratio}
                  />
                  {errors.ratio && (
                    <ThemedText style={styles.fieldErrorText}>
                      {errors.ratio.message}
                    </ThemedText>
                  )}
                </View>
              )}
            />

            {/* Ratio Helper */}
            <View style={styles.ratioHelper}>
              <ThemedText style={styles.helperTitle}>Exemplos de proporção:</ThemedText>
              <ThemedText style={styles.helperText}>• 5% = componente secundário</ThemedText>
              <ThemedText style={styles.helperText}>• 25% = componente principal</ThemedText>
              <ThemedText style={styles.helperText}>• 50% = base da fórmula</ThemedText>
            </View>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={StyleSheet.flatten([styles.actionBar, { borderTopColor: colors.border }])}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            style={styles.saveButton}
          >
{isLoading ? "Adicionando..." : "Adicionar Componente"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </>
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
    padding: spacing.md,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionText: {
    textAlign: "center",
    fontSize: fontSize.md,
    opacity: 0.7,
  },
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
  formCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
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
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
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