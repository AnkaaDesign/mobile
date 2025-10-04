import React, { useState, useMemo, useEffect } from "react";
import { View, ScrollView, ActivityIndicator , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintGround, usePaintGroundMutations, usePaints } from '../../../../../hooks';
import { paintGroundUpdateSchema } from '../../../../../schemas';
import type { PaintGroundUpdateFormData } from '../../../../../schemas';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../../constants';
import { hasPrivilege } from '../../../../../utils';
import { showToast } from "@/lib/toast/use-toast";
import {
  IconPalette,
  IconArrowRight,
  IconLayersIntersect2,
  IconCheck,
  IconEdit,
} from "@tabler/icons-react-native";

export default function EditPaintGroundScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { update } = usePaintGroundMutations();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch paint ground details
  const { data: paintGround, isLoading: isLoadingPaintGround, error } = usePaintGround(id!, {
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
        },
      },
      groundPaint: {
        include: {
          paintType: true,
          paintBrand: true,
        },
      },
    },
  });

  // Form setup
  const form = useForm<PaintGroundUpdateFormData>({
    resolver: zodResolver(paintGroundUpdateSchema),
    defaultValues: {
      paintId: "",
      groundPaintId: "",
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
    reset,
  } = form;

  // Watch form values to show preview
  const watchedValues = watch();
  const { paintId, groundPaintId } = watchedValues;

  // Fetch paints for selectors
  const { data: paints, isLoading: isLoadingPaints } = usePaints({
    include: {
      paintType: true,
      paintBrand: true,
    },
    orderBy: { name: "asc" },
  });

  // Transform paints for selectors
  const paintOptions = useMemo(() => {
    if (!paints?.data) return [];

    return paints.data.map((paint) => ({
      id: paint.id,
      label: paint.name,
      subtitle: [
        paint.code,
        paint.paintBrand?.name,
        paint.paintType?.name,
      ]
        .filter(Boolean)
        .join(" • "),
      color: paint.hex,
    }));
  }, [paints?.data]);

  // Get selected paint details for preview
  const selectedPaint = paints?.data?.find((p) => p.id === paintId);
  const selectedGroundPaint = paints?.data?.find((p) => p.id === groundPaintId);

  // Reset form when paint ground data is loaded
  useEffect(() => {
    if (paintGround?.data) {
      reset({
        paintId: paintGround.data.paintId,
        groundPaintId: paintGround.data.groundPaintId,
      });
    }
  }, [paintGround, reset]);

  // Handle form submission
  const onSubmit = async (data: PaintGroundUpdateFormData) => {
    if (!canEdit) {
      showToast("Você não tem permissão para editar", "error");
      return;
    }

    if (!isValid || !isDirty) {
      if (!isDirty) {
        showToast("Nenhuma alteração foi feita", "info");
        return;
      }
      showToast("Por favor, corrija os erros no formulário", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await update({ id: id!, data });

      showToast("Base de tinta atualizada com sucesso", "success");
      router.back();
    } catch (error) {
      showToast("Erro ao atualizar base de tinta", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (!canEdit) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para editar bases de tinta
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  if (isLoadingPaintGround || isLoadingPaints) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>
          {isLoadingPaintGround ? "Carregando base de tinta..." : "Carregando tintas..."}
        </ThemedText>
      </View>
    );
  }

  if (error || !paintGround) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          {error ? "Erro ao carregar detalhes" : "Base de tinta não encontrada"}
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Base de Tinta",
          headerBackTitle: "Cancelar",
          headerRight: () => (
            <Button
              size="sm"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || !isDirty || isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          ),
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <IconEdit size={24} color={colors.primary} />
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>Editar Base de Tinta</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Modifique a relação entre tinta e sua base necessária
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Current Relationship (Read-only display) */}
        <Card style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <IconLayersIntersect2 size={20} color={colors.muted} />
            <ThemedText style={styles.currentTitle}>Relação Atual</ThemedText>
          </View>

          <View style={styles.currentContent}>
            {/* Current Main Paint */}
            <View style={styles.currentPaint}>
              <View
                style={[
                  styles.currentColorIndicator,
                  { backgroundColor: paintGround?.data?.paint?.hex || colors.muted },
                ]}
              />
              <View style={styles.currentPaintInfo}>
                <ThemedText style={styles.currentPaintName}>
                  {paintGround?.data?.paint?.name}
                </ThemedText>
                {paintGround?.data?.paint?.code && (
                  <ThemedText style={styles.currentPaintCode}>
                    {paintGround?.data?.paint?.code}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Arrow */}
            <View style={styles.currentArrow}>
              <IconArrowRight size={16} color={colors.muted} />
              <ThemedText style={styles.currentArrowText}>precisa</ThemedText>
            </View>

            {/* Current Ground Paint */}
            <View style={styles.currentPaint}>
              <View
                style={[
                  styles.currentColorIndicator,
                  { backgroundColor: paintGround?.data?.groundPaint?.hex || colors.muted },
                ]}
              />
              <View style={styles.currentPaintInfo}>
                <ThemedText style={styles.currentPaintName}>
                  {paintGround?.data?.groundPaint?.name}
                </ThemedText>
                {paintGround?.data?.groundPaint?.code && (
                  <ThemedText style={styles.currentPaintCode}>
                    {paintGround?.data?.groundPaint?.code}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Main Paint Selection */}
        <Card style={styles.formCard}>
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <IconPalette size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Nova Tinta Principal</ThemedText>
            </View>
            <ThemedText style={styles.sectionDescription}>
              Selecione a nova tinta que precisa de uma base específica
            </ThemedText>

            <Controller
              control={control}
              name="paintId"
              render={({ field: { onChange, value } }) => (
                <SearchableSelect
                  value={value}
                  onValueChange={onChange}
                  options={paintOptions}
                  placeholder="Buscar tinta..."
                  emptyText="Nenhuma tinta encontrada"
                  error={!!errors.paintId}
                  renderOption={(option) => (
                    <View style={styles.optionContainer}>
                      <View
                        style={[
                          styles.optionColorIndicator,
                          { backgroundColor: option.color || colors.muted },
                        ]}
                      />
                      <View style={styles.optionContent}>
                        <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                        {option.subtitle && (
                          <ThemedText style={styles.optionSubtitle}>{option.subtitle}</ThemedText>
                        )}
                      </View>
                    </View>
                  )}
                />
              )}
            />
          </View>
        </Card>

        {/* Ground Paint Selection */}
        <Card style={styles.formCard}>
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <IconPalette size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Nova Tinta Base</ThemedText>
            </View>
            <ThemedText style={styles.sectionDescription}>
              Selecione a nova tinta base necessária para a tinta principal
            </ThemedText>

            <Controller
              control={control}
              name="groundPaintId"
              render={({ field: { onChange, value } }) => (
                <SearchableSelect
                  value={value}
                  onValueChange={onChange}
                  options={paintOptions}
                  placeholder="Buscar tinta base..."
                  emptyText="Nenhuma tinta encontrada"
                  error={!!errors.groundPaintId}
                  renderOption={(option) => (
                    <View style={styles.optionContainer}>
                      <View
                        style={[
                          styles.optionColorIndicator,
                          { backgroundColor: option.color || colors.muted },
                        ]}
                      />
                      <View style={styles.optionContent}>
                        <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                        {option.subtitle && (
                          <ThemedText style={styles.optionSubtitle}>{option.subtitle}</ThemedText>
                        )}
                      </View>
                    </View>
                  )}
                />
              )}
            />
          </View>
        </Card>

        {/* Preview */}
        {selectedPaint && selectedGroundPaint && isDirty && (
          <Card style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <IconCheck size={20} color={colors.success} />
              <ThemedText style={styles.previewTitle}>Nova Relação</ThemedText>
            </View>

            <View style={styles.previewContent}>
              {/* Main Paint */}
              <View style={styles.previewPaint}>
                <View
                  style={[
                    styles.previewColorIndicator,
                    { backgroundColor: selectedPaint.hex || colors.muted },
                  ]}
                />
                <View style={styles.previewPaintInfo}>
                  <ThemedText style={styles.previewPaintName}>
                    {selectedPaint.name}
                  </ThemedText>
                  {selectedPaint.code && (
                    <ThemedText style={styles.previewPaintCode}>
                      {selectedPaint.code}
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* Arrow */}
              <View style={styles.previewArrow}>
                <IconArrowRight size={16} color={colors.primary} />
                <ThemedText style={styles.previewArrowText}>precisa</ThemedText>
              </View>

              {/* Ground Paint */}
              <View style={styles.previewPaint}>
                <View
                  style={[
                    styles.previewColorIndicator,
                    { backgroundColor: selectedGroundPaint.hex || colors.muted },
                  ]}
                />
                <View style={styles.previewPaintInfo}>
                  <ThemedText style={styles.previewPaintName}>
                    {selectedGroundPaint.name}
                  </ThemedText>
                  {selectedGroundPaint.code && (
                    <ThemedText style={styles.previewPaintCode}>
                      {selectedGroundPaint.code}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.actionButton}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={styles.actionButton}
            disabled={!isValid || !isDirty || isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  headerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    lineHeight: 20,
  },
  currentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  currentTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
    opacity: 0.7,
  },
  currentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentPaint: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currentColorIndicator: {
    width: 28,
    height: 28,
    borderRadius: 5,
    marginRight: spacing.sm,
    opacity: 0.7,
  },
  currentPaintInfo: {
    flex: 1,
  },
  currentPaintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    opacity: 0.7,
  },
  currentPaintCode: {
    fontSize: fontSize.xs,
    opacity: 0.5,
    marginTop: 2,
  },
  currentArrow: {
    alignItems: "center",
    marginHorizontal: spacing.sm,
  },
  currentArrowText: {
    fontSize: fontSize.xs,
    opacity: 0.5,
    marginTop: 2,
  },
  formCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  formSection: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  optionColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  optionSubtitle: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  previewCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewPaint: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  previewColorIndicator: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  previewPaintInfo: {
    flex: 1,
  },
  previewPaintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  previewPaintCode: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  previewArrow: {
    alignItems: "center",
    marginHorizontal: spacing.sm,
  },
  previewArrowText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});