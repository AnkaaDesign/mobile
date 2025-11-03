import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { paintCreateSchema, paintUpdateSchema, type PaintCreateFormData, type PaintUpdateFormData } from '../../../schemas';
import { usePaintTypes, usePaintBrands, usePaints } from '../../../hooks';
import { PAINT_FINISH, COLOR_PALETTE, TRUCK_MANUFACTURER } from '../../../constants';
import { IconLoader } from "@tabler/icons-react-native";

type PaintFormData = PaintCreateFormData | PaintUpdateFormData;

interface PaintFormProps {
  mode: "create" | "edit";
  initialData?: Partial<PaintFormData>;
  onSubmit: (data: PaintFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const FINISH_OPTIONS = [
  { value: PAINT_FINISH.METALLIC, label: "Metálico" },
  { value: PAINT_FINISH.SOLID, label: "Sólido" },
  { value: PAINT_FINISH.PEARL, label: "Perolizado" },
  { value: PAINT_FINISH.MATTE, label: "Fosco" },
  { value: PAINT_FINISH.SATIN, label: "Acetinado" },
];

const PALETTE_OPTIONS = [
  { value: COLOR_PALETTE.WHITE, label: "Branco" },
  { value: COLOR_PALETTE.BLACK, label: "Preto" },
  { value: COLOR_PALETTE.GRAY, label: "Cinza" },
  { value: COLOR_PALETTE.SILVER, label: "Prata" },
  { value: COLOR_PALETTE.RED, label: "Vermelho" },
  { value: COLOR_PALETTE.BLUE, label: "Azul" },
  { value: COLOR_PALETTE.GREEN, label: "Verde" },
  { value: COLOR_PALETTE.YELLOW, label: "Amarelo" },
  { value: COLOR_PALETTE.ORANGE, label: "Laranja" },
  { value: COLOR_PALETTE.BROWN, label: "Marrom" },
  { value: COLOR_PALETTE.BEIGE, label: "Bege" },
  { value: COLOR_PALETTE.GOLDEN, label: "Dourado" },
  { value: COLOR_PALETTE.PINK, label: "Rosa" },
  { value: COLOR_PALETTE.PURPLE, label: "Roxo" },
];

const MANUFACTURER_OPTIONS = [
  { value: TRUCK_MANUFACTURER.VOLKSWAGEN, label: "Volkswagen" },
  { value: TRUCK_MANUFACTURER.MERCEDES_BENZ, label: "Mercedes-Benz" },
  { value: TRUCK_MANUFACTURER.SCANIA, label: "Scania" },
  { value: TRUCK_MANUFACTURER.VOLVO, label: "Volvo" },
  { value: TRUCK_MANUFACTURER.IVECO, label: "Iveco" },
  { value: TRUCK_MANUFACTURER.DAF, label: "DAF" },
];

export function PaintForm({ mode, initialData, onSubmit, onCancel, isSubmitting }: PaintFormProps) {
  const { colors } = useTheme();
  const [paintTypeSearch, setPaintTypeSearch] = useState("");
  const [paintBrandSearch, setPaintBrandSearch] = useState("");
  const [groundPaintSearch, setGroundPaintSearch] = useState("");

  const form = useForm<PaintFormData>({
    resolver: zodResolver(mode === "create" ? paintCreateSchema : paintUpdateSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || null,
      hex: initialData?.hex || "",
      finish: initialData?.finish || PAINT_FINISH.SOLID,
      paintTypeId: initialData?.paintTypeId || "",
      paintBrandId: initialData?.paintBrandId || null,
      manufacturer: initialData?.manufacturer || null,
      tags: initialData?.tags || [],
      palette: initialData?.palette || undefined,
      paletteOrder: initialData?.paletteOrder || undefined,
      groundIds: initialData?.groundIds || [],
    } as any,
  });

  // Fetch paint types
  const { data: paintTypes, isLoading: isLoadingTypes } = usePaintTypes({
    searchingFor: paintTypeSearch,
    orderBy: { name: "asc" },
  });

  // Fetch paint brands
  const { data: paintBrands, isLoading: isLoadingBrands } = usePaintBrands({
    searchingFor: paintBrandSearch,
    orderBy: { name: "asc" },
  });

  // Fetch paints for ground selection
  const { data: paints, isLoading: isLoadingPaints } = usePaints({
    searchingFor: groundPaintSearch,
    orderBy: { name: "asc" },
  });

  const paintTypeOptions = paintTypes?.data?.map((type) => ({
    value: type.id,
    label: type.name,
  })) || [];

  const paintBrandOptions = paintBrands?.data?.map((brand) => ({
    value: brand.id,
    label: brand.name,
  })) || [];

  const groundPaintOptions = paints?.data?.map((paint) => ({
    value: paint.id,
    label: paint.name,
  })) || [];

  const handleSubmit = async (data: PaintFormData) => {
    await onSubmit(data);
  };

  return (
    <FormProvider {...form}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Basic Information */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Name */}
              <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Nome da Tinta *</Label>
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="Ex: Vermelho Ferrari"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Code */}
              <Controller
                control={form.control}
                name="code"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Código</Label>
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Ex: VW-123"
                      disabled={isSubmitting}
                      maxLength={20}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Hex Color */}
              <Controller
                control={form.control}
                name="hex"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Cor Hexadecimal *</Label>
                    <View style={styles.hexRow}>
                      <View style={styles.hexInputContainer}>
                        <Input
                          value={value}
                          onChangeText={onChange}
                          placeholder="#FF0000"
                          disabled={isSubmitting}
                          autoCapitalize="characters"
                        />
                      </View>
                      {value && (
                        <View style={[styles.colorPreview, { backgroundColor: value }]} />
                      )}
                    </View>
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Finish */}
              <Controller
                control={form.control}
                name="finish"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Acabamento *</Label>
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={FINISH_OPTIONS}
                      placeholder="Selecione o acabamento"
                      disabled={isSubmitting}
                      searchable={false}
                      clearable={false}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Classification */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Paint Type */}
              <Controller
                control={form.control}
                name="paintTypeId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Tipo de Tinta *</Label>
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={paintTypeOptions}
                      placeholder="Selecione o tipo"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado"
                      onSearchChange={setPaintTypeSearch}
                      disabled={isSubmitting || isLoadingTypes}
                      loading={isLoadingTypes}
                      clearable={false}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Paint Brand */}
              <Controller
                control={form.control}
                name="paintBrandId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Marca da Tinta</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={paintBrandOptions}
                      placeholder="Selecione a marca"
                      searchPlaceholder="Buscar marca..."
                      emptyText="Nenhuma marca encontrada"
                      onSearchChange={setPaintBrandSearch}
                      disabled={isSubmitting || isLoadingBrands}
                      loading={isLoadingBrands}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Manufacturer */}
              <Controller
                control={form.control}
                name="manufacturer"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Montadora</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={MANUFACTURER_OPTIONS}
                      placeholder="Selecione a montadora"
                      searchPlaceholder="Buscar montadora..."
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Paleta de Cores</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Palette */}
              <Controller
                control={form.control}
                name="palette"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Paleta</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || undefined)}
                      options={PALETTE_OPTIONS}
                      placeholder="Selecione a paleta"
                      searchPlaceholder="Buscar paleta..."
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Palette Order */}
              <Controller
                control={form.control}
                name="paletteOrder"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Ordem na Paleta (1-14)</Label>
                    <Input
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      placeholder="Ex: 1"
                      keyboardType="numeric"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Ground Paints */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Tintas de Fundo</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="groundIds"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Selecionar Tintas de Fundo</Label>
                    <Combobox mode="multiple"
                      options={groundPaintOptions}
                      selectedValues={Array.isArray(value) ? value : []}
                      onValueChange={onChange}
                      onCreate={() => {}}
                      onSearchChange={setGroundPaintSearch}
                      onEndReached={() => {}}
                      placeholder="Selecione as tintas de fundo"
                      selectedText="tintas selecionadas"
                      searchPlaceholder="Buscar tintas..."
                      disabled={isSubmitting || isLoadingPaints}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.cancelButton}>
                Cancelar
              </Button>
              <Button
                onPress={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                  </>
                ) : (
                  <ThemedText style={{ color: colors.primaryForeground }}>
                    {mode === "create" ? "Criar Tinta" : "Salvar Alterações"}
                  </ThemedText>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ThemedScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    gap: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  hexInputContainer: {
    flex: 1,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  actionsContainer: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 120,
  },
});
