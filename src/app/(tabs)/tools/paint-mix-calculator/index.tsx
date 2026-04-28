import { useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useForm, useFieldArray, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPalette,
  IconPlus,
  IconRefresh,
  IconCalculator,
} from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/lib/theme";
import { useScreenReady } from "@/hooks";
import { usePaintTypes } from "@/hooks/paintType";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils/number";
import {
  findPresetForPaintType,
  type MixSlot,
  DEFAULT_PRESET,
} from "@/constants/paint-mix-presets";
import {
  computeSlotVolumes,
  computeTotalCost,
  computeCostPerLiter,
} from "@/utils/paint-mix-math";
import type { PaintType, Item } from "@/types";

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const slotSchema = z.object({
  id: z.string(),
  label: z.string(),
  itemId: z.string().nullable(),
  ratio: z.number().min(0).default(1),
});

const formSchema = z.object({
  paintTypeId: z.string().nullable(),
  totalLiters: z.number().min(0).default(1),
  slots: z.array(slotSchema),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract current price-per-liter for an Item.
 *
 * Tries (in order):
 *   1. The virtual `price` field returned by the API.
 *   2. `prices[0]` (sorted newest-first by the API).
 *   3. null if no price is available.
 */
function getCurrentPrice(item: Item | null | undefined): number | null {
  if (!item) return null;
  if (typeof item.price === "number" && Number.isFinite(item.price)) {
    return item.price;
  }
  const prices = item.prices;
  if (Array.isArray(prices) && prices.length > 0) {
    const v = prices[0]?.value;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

/** Slot defaults from a preset slot definition. */
function buildSlotDefault(slot: MixSlot): FormValues["slots"][number] {
  return {
    id: slot.id,
    label: slot.label,
    itemId: null,
    ratio: slot.defaultRatio,
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PaintMixCalculatorScreen() {
  useScreenReady();
  const { colors } = useTheme();

  // Fetch paint types with component items + price (virtual).
  const paintTypesQuery = usePaintTypes({
    orderBy: { name: "asc" },
    include: {
      componentItems: {
        include: { price: true },
      },
    },
  } as any);

  const paintTypes: PaintType[] = useMemo(() => {
    const data = paintTypesQuery.data?.data;
    return Array.isArray(data) ? data : [];
  }, [paintTypesQuery.data]);

  // Initial preset: default until user picks a paint type.
  const initialSlots = useMemo(
    () => DEFAULT_PRESET.slots.map(buildSlotDefault),
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paintTypeId: null,
      totalLiters: 1,
      slots: initialSlots,
    },
    mode: "onChange",
  });

  const { control, setValue, reset } = form;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "slots",
  });

  const watchedSlots = useWatch({ control, name: "slots" }) ?? [];
  const totalLiters = useWatch({ control, name: "totalLiters" }) ?? 0;
  const paintTypeId = useWatch({ control, name: "paintTypeId" });

  // Resolve the selected paint type and its component items.
  const selectedPaintType = useMemo(
    () => paintTypes.find((pt) => pt.id === paintTypeId) ?? null,
    [paintTypes, paintTypeId],
  );

  const componentItems: Item[] = useMemo(
    () => selectedPaintType?.componentItems ?? [],
    [selectedPaintType],
  );

  // Quick lookup id → item.
  const itemsById = useMemo(() => {
    const map = new Map<string, Item>();
    for (const it of componentItems) map.set(it.id, it);
    return map;
  }, [componentItems]);

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------

  const handlePaintTypeChange = useCallback(
    (next: string | null | undefined) => {
      const id = typeof next === "string" ? next : null;
      setValue("paintTypeId", id, { shouldDirty: true });

      // Apply the matching preset's slots, resetting any selected items
      // (the previous paint type's items are no longer valid).
      const pt = paintTypes.find((p) => p.id === id);
      const preset = findPresetForPaintType(pt?.name);
      replace(preset.slots.map(buildSlotDefault));
    },
    [paintTypes, replace, setValue],
  );

  const handleAddSlot = useCallback(() => {
    append({
      id: `custom-${Date.now()}`,
      label: `Componente ${fields.length + 1}`,
      itemId: null,
      ratio: 1,
    });
  }, [append, fields.length]);

  const handleClear = useCallback(() => {
    reset({
      paintTypeId: null,
      totalLiters: 1,
      slots: DEFAULT_PRESET.slots.map(buildSlotDefault),
    });
  }, [reset]);

  // ---------------------------------------------------------------------
  // Derived results
  // ---------------------------------------------------------------------

  const slotResults = useMemo(() => {
    const inputs = watchedSlots.map((s) => {
      const item = s.itemId ? itemsById.get(s.itemId) ?? null : null;
      return {
        ratio: Number(s.ratio) || 0,
        pricePerLiter: getCurrentPrice(item),
      };
    });
    return computeSlotVolumes(inputs, Number(totalLiters) || 0);
  }, [watchedSlots, itemsById, totalLiters]);

  const totalCost = useMemo(() => computeTotalCost(slotResults), [slotResults]);
  const costPerLiter = useMemo(
    () => computeCostPerLiter(totalCost, Number(totalLiters) || 0),
    [totalCost, totalLiters],
  );

  // Combobox option lists (sorted: keyword matches first).
  const slotOptions = useMemo(() => {
    return watchedSlots.map((slot) => {
      const slotKeywords = slot.id
        ? findPresetForPaintType(selectedPaintType?.name).slots.find(
            (s) => s.id === slot.id,
          )?.itemNameKeywords ?? []
        : [];

      const sorted = [...componentItems].sort((a, b) => {
        const aMatch = slotKeywords.some((k) =>
          a.name.toLowerCase().includes(k),
        );
        const bMatch = slotKeywords.some((k) =>
          b.name.toLowerCase().includes(k),
        );
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return a.name.localeCompare(b.name);
      });

      return sorted.map((item) => {
        const price = getCurrentPrice(item);
        const priceLabel = price != null ? ` — ${formatCurrency(price)}/L` : "";
        return {
          value: item.id,
          label: `${item.name}${priceLabel}`,
        };
      });
    });
  }, [watchedSlots, componentItems, selectedPaintType]);

  const paintTypeOptions = useMemo(
    () => paintTypes.map((pt) => ({ value: pt.id, label: pt.name })),
    [paintTypes],
  );

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <FormProvider {...form}>
      <Stack.Screen
        options={{
          title: "Calculadora de Mistura",
          headerBackTitle: "Voltar",
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — Paint type */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <IconPalette size={20} color={colors.primary} />
              <ThemedText style={styles.cardTitle}>Tipo de Tinta</ThemedText>
            </View>
            <Label style={styles.label}>Selecione o tipo de tinta</Label>
            <Combobox
              value={paintTypeId ?? undefined}
              onValueChange={(v) =>
                handlePaintTypeChange(typeof v === "string" ? v : null)
              }
              options={paintTypeOptions}
              placeholder="Escolher tipo..."
              emptyText="Nenhum tipo de tinta encontrado"
              searchPlaceholder="Buscar tipo..."
              loading={paintTypesQuery.isLoading}
              clearable
            />
            {selectedPaintType ? (
              <ThemedText style={styles.hintText}>
                Proporção sugerida aplicada com base no tipo selecionado.
              </ThemedText>
            ) : (
              <ThemedText style={styles.hintText}>
                Sem seleção: usando proporção padrão (3 / 1 / 1).
              </ThemedText>
            )}
          </Card>

          {/* Step 2 — Target volume */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <IconCalculator size={20} color={colors.primary} />
              <ThemedText style={styles.cardTitle}>Volume Total</ThemedText>
            </View>
            <Label style={styles.label}>Volume desejado (L)</Label>
            <View style={styles.volumeRow}>
              <NumberInput
                value={Number(totalLiters) || 0}
                onChange={(v) =>
                  setValue("totalLiters", typeof v === "number" ? v : 0, {
                    shouldDirty: true,
                  })
                }
                min={0}
                step={0.1}
                decimalPlaces={2}
                placeholder="1.00"
                containerStyle={{ flex: 1 }}
              />
              <ThemedText style={styles.unitLabel}>L</ThemedText>
            </View>
          </Card>

          {/* Step 3 — Components */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <IconPalette size={20} color={colors.primary} />
              <ThemedText style={styles.cardTitle}>Componentes</ThemedText>
            </View>

            {fields.map((field, index) => {
              const slot = watchedSlots[index];
              const result = slotResults[index];
              if (!slot || !result) return null;

              return (
                <View key={field.id} style={styles.slotBlock}>
                  <View style={styles.slotHeader}>
                    <ThemedText style={styles.slotLabel}>{slot.label}</ThemedText>
                    {fields.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => remove(index)}
                      >
                        Remover
                      </Button>
                    ) : null}
                  </View>

                  <Label style={styles.label}>Item</Label>
                  <Combobox
                    value={slot.itemId ?? undefined}
                    onValueChange={(v) =>
                      setValue(
                        `slots.${index}.itemId`,
                        typeof v === "string" ? v : null,
                        { shouldDirty: true },
                      )
                    }
                    options={slotOptions[index] ?? []}
                    placeholder={
                      selectedPaintType
                        ? "Escolher item..."
                        : "Selecione um tipo de tinta primeiro"
                    }
                    emptyText="Nenhum item compatível"
                    searchPlaceholder="Buscar item..."
                    disabled={!selectedPaintType || componentItems.length === 0}
                    clearable
                  />

                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Label style={styles.label}>Partes</Label>
                      <NumberInput
                        value={Number(slot.ratio) || 0}
                        onChange={(v) =>
                          setValue(
                            `slots.${index}.ratio`,
                            typeof v === "number" ? v : 0,
                            { shouldDirty: true },
                          )
                        }
                        min={0}
                        step={1}
                        decimalPlaces={2}
                      />
                    </View>
                    <View style={styles.col}>
                      <Label style={styles.label}>Volume</Label>
                      <View style={styles.readonlyValue}>
                        <ThemedText style={styles.readonlyText}>
                          {result.volumeLiters.toFixed(3)} L
                        </ThemedText>
                        <ThemedText style={styles.readonlySubText}>
                          {result.volumeMl} mL
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Label style={styles.label}>Custo</Label>
                      <View style={styles.readonlyValue}>
                        <ThemedText style={styles.readonlyText}>
                          {result.cost == null ? "—" : formatCurrency(result.cost)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {index < fields.length - 1 ? <Separator style={styles.divider} /> : null}
                </View>
              );
            })}

            <Button
              variant="outline"
              onPress={handleAddSlot}
              icon={<IconPlus size={16} color={colors.primary} />}
              style={styles.addButton}
            >
              Adicionar Componente
            </Button>
          </Card>

          {/* Step 4 — Result */}
          <Card style={[styles.card, styles.resultCard]}>
            <View style={styles.cardHeader}>
              <IconCalculator size={20} color={colors.primary} />
              <ThemedText style={styles.cardTitle}>Resultado</ThemedText>
            </View>

            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <ThemedText style={styles.resultLabel}>Volume Total</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {(Number(totalLiters) || 0).toFixed(3)} L
                </ThemedText>
              </View>
              <View style={styles.resultItem}>
                <ThemedText style={styles.resultLabel}>Custo Total</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {totalCost == null ? "—" : formatCurrency(totalCost)}
                </ThemedText>
              </View>
              <View style={styles.resultItem}>
                <ThemedText style={styles.resultLabel}>Custo por Litro</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {costPerLiter == null ? "—" : `${formatCurrency(costPerLiter)}/L`}
                </ThemedText>
              </View>
            </View>

            {totalCost == null ? (
              <ThemedText style={styles.warnText}>
                Selecione todos os itens e garanta que possuam preço cadastrado
                para visualizar o custo total.
              </ThemedText>
            ) : null}
          </Card>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button
              variant="outline"
              onPress={handleClear}
              style={{ flex: 1 }}
              icon={<IconRefresh size={16} color={colors.foreground} />}
            >
              Limpar
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.screenPaddingBottom + spacing.xl,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  hintText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  unitLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    minWidth: 24,
    textAlign: "center",
  },
  slotBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  readonlyValue: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: "center",
  },
  readonlyText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  readonlySubText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  addButton: {
    marginTop: spacing.sm,
  },
  resultCard: {
    gap: spacing.md,
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  resultItem: {
    flexGrow: 1,
    minWidth: 100,
    gap: spacing.xxs,
  },
  resultLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  resultValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  warnText: {
    fontSize: fontSize.xs,
    opacity: 0.8,
    fontStyle: "italic",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionLabel: {
    marginLeft: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
