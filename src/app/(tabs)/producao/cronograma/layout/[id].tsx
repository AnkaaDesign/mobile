import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SimpleFormField } from "@/components/ui/simple-form-field";
import { FormActionBar } from "@/components/forms";
import { SkeletonCard } from "@/components/ui/loading";
import { LayoutForm } from "@/components/production/layout/layout-form";
import { useTaskDetail, useLayoutsByTruck, useLayoutMutations } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, TRUCK_MANUFACTURER } from "@/constants";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { canEditLayouts, canEditLayoutsOnly, canEditLayoutForTask } from "@/utils/permissions/entity-permissions";
import type { LayoutCreateFormData, TruckCreateFormData } from "@/schemas";
import { Icon } from "@/components/ui/icon";
import { truckService } from "@/api-client";

export default function LayoutOnlyEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { createOrUpdateTruckLayout, isSavingTruckLayout } = useLayoutMutations();
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions - Only LEADER and LOGISTIC can use this page
  // ADMIN should use the full edit page instead
  const canEditLayout = canEditLayouts(user);

  // Fetch task details
  const {
    data: response,
    isLoading: isLoadingTask,
    error,
  } = useTaskDetail(id!, {
    include: {
      customer: true,
      truck: true,
    },
  });

  const task = response?.data;

  // Fetch truck layouts if task has a truck
  const truckId = task?.truck?.id;
  const { data: layoutsData, isLoading: isLoadingLayouts } = useLayoutsByTruck(truckId || "", {
    include: { layoutSections: true },
    enabled: !!truckId,
  });

  // Layout state - Include photoUri for new photos that need to be uploaded
  type LayoutWithPhoto = LayoutCreateFormData & { photoUri?: string };
  const [selectedLayoutSide, setSelectedLayoutSide] = useState<"left" | "right" | "back">("left");
  const [layouts, setLayouts] = useState<{
    left?: LayoutWithPhoto;
    right?: LayoutWithPhoto;
    back?: LayoutWithPhoto;
  }>({
    left: { height: 2.4, layoutSections: [{ width: 8, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
    right: { height: 2.4, layoutSections: [{ width: 8, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
    back: { height: 2.42, layoutSections: [{ width: 2.42, isDoor: false, doorHeight: null, position: 0 }], photoId: null },
  });

  // Track which sides were modified
  const [modifiedLayoutSides, setModifiedLayoutSides] = useState<Set<"left" | "right" | "back">>(new Set());

  // Track selected existing layouts for each side (for layout assignment)
  const [selectedExistingLayouts, setSelectedExistingLayouts] = useState<{
    left?: string;
    right?: string;
    back?: string;
  }>({});

  // Layout width validation error
  const [layoutWidthError, setLayoutWidthError] = useState<string | null>(null);

  // Transform layout data from backend format to LayoutCreateFormData format
  const existingLayouts = useMemo(() => {
    if (!layoutsData) return undefined;

    const transformedLayouts: any = {};

    // Transform left side layout
    if (layoutsData.leftSideLayout?.layoutSections) {
      transformedLayouts.left = {
        height: layoutsData.leftSideLayout.height,
        layoutSections: layoutsData.leftSideLayout.layoutSections.map((s: any) => ({
          width: s.width,
          isDoor: s.isDoor,
          doorHeight: s.doorHeight,
          position: s.position,
        })),
        photoId: layoutsData.leftSideLayout.photoId,
      };
    }

    // Transform right side layout
    if (layoutsData.rightSideLayout?.layoutSections) {
      transformedLayouts.right = {
        height: layoutsData.rightSideLayout.height,
        layoutSections: layoutsData.rightSideLayout.layoutSections.map((s: any) => ({
          width: s.width,
          isDoor: s.isDoor,
          doorHeight: s.doorHeight,
          position: s.position,
        })),
        photoId: layoutsData.rightSideLayout.photoId,
      };
    }

    // Transform back side layout
    if (layoutsData.backSideLayout?.layoutSections) {
      transformedLayouts.back = {
        height: layoutsData.backSideLayout.height,
        layoutSections: layoutsData.backSideLayout.layoutSections.map((s: any) => ({
          width: s.width,
          isDoor: s.isDoor,
          doorHeight: s.doorHeight,
          position: s.position,
        })),
        photoId: layoutsData.backSideLayout.photoId,
      };
    }

    return Object.keys(transformedLayouts).length > 0 ? transformedLayouts : undefined;
  }, [layoutsData]);

  // Update layouts when data loads
  useEffect(() => {
    if (existingLayouts) {
      setLayouts(prev => ({
        ...prev,
        ...existingLayouts,
      }));
    }
  }, [existingLayouts]);

  // Real-time validation of layout width balance
  useEffect(() => {
    // Get layoutSections from current layout state
    const leftLayout = layouts.left;
    const rightLayout = layouts.right;
    const leftSections = leftLayout?.layoutSections;
    const rightSections = rightLayout?.layoutSections;

    // Only validate if both sides exist and have layoutSections
    if (leftSections && leftSections.length > 0 && rightSections && rightSections.length > 0) {
      const leftTotalWidth = leftSections.reduce((sum: number, s: any) => sum + (s.width || 0), 0);
      const rightTotalWidth = rightSections.reduce((sum: number, s: any) => sum + (s.width || 0), 0);
      const widthDifference = Math.abs(leftTotalWidth - rightTotalWidth);
      const maxAllowedDifference = 0.02; // 2cm in meters

      if (widthDifference > maxAllowedDifference) {
        const errorMessage = `O layout possui diferença de largura maior que 2cm entre os lados. Lado Motorista: ${(leftTotalWidth * 100).toFixed(0)}cm, Lado Sapo: ${(rightTotalWidth * 100).toFixed(0)}cm (diferença de ${(widthDifference * 100).toFixed(1)}cm). Ajuste as medidas antes de enviar o formulário.`;
        setLayoutWidthError(errorMessage);
      } else {
        setLayoutWidthError(null);
      }
    } else {
      setLayoutWidthError(null);
    }
  }, [layouts]);

  // Check if any layout exists
  const hasExistingLayout = !!(existingLayouts?.left || existingLayouts?.right || existingLayouts?.back);

  // When there's no existing layout, mark all sides as modified to create them with defaults
  useEffect(() => {
    if (!hasExistingLayout && modifiedLayoutSides.size === 0) {
      setModifiedLayoutSides(new Set(['left', 'right', 'back']));
    }
  }, [hasExistingLayout, modifiedLayoutSides.size]);

  const handleSubmit = async () => {
    if (modifiedLayoutSides.size === 0) {
      Alert.alert("Info", "Nenhuma alteracao foi feita no layout.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto-create truck if it doesn't exist
      let activeTruckId = truckId;
      if (!activeTruckId) {
        try {
          const truckData: TruckCreateFormData = {
            model: `Caminhão - ${task?.name || 'Tarefa'}`,
            manufacturer: TRUCK_MANUFACTURER.VOLVO,
            taskId: id!,
          };
          const truckResponse = await truckService.createTruck(truckData);
          activeTruckId = truckResponse.data.id;
          console.log('[Layout] Auto-created truck:', activeTruckId);
        } catch (error) {
          console.error('[Layout] Failed to auto-create truck:', error);
          Alert.alert("Erro", "Não foi possível criar o caminhão automaticamente.");
          setIsSubmitting(false);
          return;
        }
      }

      // Save each modified side
      const savePromises: Promise<any>[] = [];

      for (const side of modifiedLayoutSides) {
        const existingLayoutId = selectedExistingLayouts[side];
        const layoutData = layouts[side];

        // If an existing layout is selected, use assignLayoutToTruck
        if (existingLayoutId) {
          console.log(`[LayoutOnlyEdit] 🔗 Assigning existing layout ${existingLayoutId} to ${side} side`);
          savePromises.push(
            createOrUpdateTruckLayout({
              truckId: activeTruckId,
              side,
              data: layoutData || { height: 2.4, layoutSections: [], photoId: null },
              existingLayoutId,
            })
          );
        } else if (layoutData && layoutData.layoutSections && layoutData.layoutSections.length > 0) {
          // Otherwise, create/update a new layout
          console.log(`[LayoutOnlyEdit] 💾 Saving ${side} layout:`, {
            hasPhotoUri: !!(layoutData as any).photoUri,
            photoUri: (layoutData as any).photoUri,
            hasPhotoId: !!layoutData.photoId,
            photoId: layoutData.photoId,
            sectionsCount: layoutData.layoutSections.length,
          });
          savePromises.push(
            createOrUpdateTruckLayout({
              truckId: activeTruckId,
              side,
              data: layoutData,
            })
          );
        }
      }

      await Promise.all(savePromises);

      // API client already shows success alert

      router.replace(routeToMobilePath(routes.production.schedule.root) as any);
    } catch (error: any) {
      console.error("[LayoutOnlyEdit] Error saving layout:", error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Check if user can edit this specific task's layout (managed sector check)
  const canEditThisTaskLayout = canEditLayoutForTask(user, task?.sectorId);

  // Permission check effect - redirect if no permission for this task
  useEffect(() => {
    if (user !== undefined && task !== undefined && !isLoadingTask) {
      setCheckingPermission(false);

      // Check basic layout permission first
      if (!canEditLayout) {
        Alert.alert("Acesso negado", "Voce nao tem permissao para editar layouts");
        router.replace("/producao/cronograma");
        return;
      }

      // Check if user can edit THIS task's layout (managed sector validation)
      if (!canEditThisTaskLayout) {
        Alert.alert("Acesso negado", "Voce so pode editar layouts de tarefas do seu setor gerenciado ou tarefas sem setor definido");
        router.replace("/producao/cronograma");
      }
    }
  }, [user, task, isLoadingTask, canEditLayout, canEditThisTaskLayout, router]);

  // Show loading while checking permission or loading task
  if (checkingPermission || !user || isLoadingTask) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 16 }}>Verificando permissoes...</ThemedText>
      </View>
    );
  }

  // If no permission, show nothing (redirect will happen)
  if (!canEditLayout || !canEditThisTaskLayout) {
    return null;
  }

  if (isLoadingLayouts) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeletonLarge} />
        </View>
      </ThemedView>
    );
  }

  if (error || !task) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Tarefa nao encontrada</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.mutedForeground }]}>
            A tarefa que voce esta procurando nao existe ou foi removida.
          </ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={{ color: colors.primaryForeground }}>Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Task Identification Card - Read-only fields for confirmation */}
            <Card style={styles.infoCard}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Icon name="file-text" size={20} color={colors.primary} />
                <ThemedText style={styles.cardTitle}>Identificacao da Tarefa</ThemedText>
              </View>
              <View style={styles.cardContent}>
                {/* Task Name - Disabled */}
                <SimpleFormField label="Nome da Tarefa">
                  <Input
                    value={task.name}
                    editable={false}
                    style={[styles.disabledInput, { backgroundColor: colors.muted }]}
                  />
                </SimpleFormField>

                {/* Serial Number - Disabled */}
                <SimpleFormField label="Numero de Serie">
                  <Input
                    value={task.serialNumber || task.truck?.plate || "Nao informado"}
                    editable={false}
                    style={[styles.disabledInput, { backgroundColor: colors.muted }]}
                  />
                </SimpleFormField>

                {/* Customer - Disabled */}
                {task.customer && (
                  <SimpleFormField label="Cliente">
                    <Input
                      value={task.customer.fantasyName || task.customer.name || ""}
                      editable={false}
                      style={[styles.disabledInput, { backgroundColor: colors.muted }]}
                    />
                  </SimpleFormField>
                )}
              </View>
            </Card>

            {/* Layout Section */}
            {(
              <Card style={styles.layoutCard}>
                <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                  <Icon name="ruler" size={20} color={colors.primary} />
                  <ThemedText style={styles.cardTitle}>Layout do Caminhao</ThemedText>
                  {hasExistingLayout && (
                    <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                      <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
                        Existente
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  {/* Side Selector */}
                  <View style={styles.layoutSideSelector}>
                    <Button
                      variant={selectedLayoutSide === "left" ? "default" : "outline"}
                      size="sm"
                      onPress={() => setSelectedLayoutSide("left")}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      <ThemedText style={{
                        fontSize: fontSize.sm,
                        color: selectedLayoutSide === "left" ? colors.primaryForeground : colors.foreground
                      }}>
                        Motorista
                      </ThemedText>
                    </Button>
                    <Button
                      variant={selectedLayoutSide === "right" ? "default" : "outline"}
                      size="sm"
                      onPress={() => setSelectedLayoutSide("right")}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      <ThemedText style={{
                        fontSize: fontSize.sm,
                        color: selectedLayoutSide === "right" ? colors.primaryForeground : colors.foreground
                      }}>
                        Sapo
                      </ThemedText>
                    </Button>
                    <Button
                      variant={selectedLayoutSide === "back" ? "default" : "outline"}
                      size="sm"
                      onPress={() => setSelectedLayoutSide("back")}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      <ThemedText style={{
                        fontSize: fontSize.sm,
                        color: selectedLayoutSide === "back" ? colors.primaryForeground : colors.foreground
                      }}>
                        Traseira
                      </ThemedText>
                    </Button>
                  </View>

                  {/* Layout Form */}
                  <LayoutForm
                    selectedSide={selectedLayoutSide}
                    layouts={layouts}
                    showLayoutSelection={true}
                    onSelectExistingLayout={(side, layoutId) => {
                      console.log('[LayoutOnlyEdit] Selected existing layout:', { side, layoutId });
                      setSelectedExistingLayouts(prev => ({
                        ...prev,
                        [side]: layoutId,
                      }));
                      setModifiedLayoutSides(prev => {
                        const newSet = new Set(prev);
                        newSet.add(side);
                        return newSet;
                      });
                    }}
                    onChange={(side, layoutData) => {
                      console.log('[LayoutOnlyEdit] 📥 Received onChange:', {
                        side,
                        hasPhotoUri: !!(layoutData as any).photoUri,
                        photoUri: (layoutData as any).photoUri,
                        hasPhotoId: !!layoutData.photoId,
                        photoId: layoutData.photoId,
                      });
                      setModifiedLayoutSides((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(side);
                        return newSet;
                      });
                      setLayouts((prev) => ({
                        ...prev,
                        [side]: layoutData,
                      }));
                    }}
                    disabled={isSubmitting}
                    embedded={true}
                  />

                  {/* Layout Width Validation Error */}
                  {layoutWidthError && (
                    <View style={[styles.layoutValidationError, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]}>
                      <Icon name="alert-triangle" size={18} color={colors.destructive} />
                      <ThemedText style={[styles.layoutValidationErrorText, { color: colors.destructive }]}>
                        {layoutWidthError}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <FormActionBar
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || isSavingTruckLayout}
        submitLabel={hasExistingLayout ? "Salvar Alteracoes" : "Cadastrar Layout"}
        canSubmit={modifiedLayoutSides.size > 0 && !layoutWidthError}
      />
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
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeleton: {
    height: 150,
  },
  skeletonLarge: {
    height: 400,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  infoCard: {
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  disabledInput: {
    opacity: 0.7,
  },
  warningCard: {
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    gap: spacing.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  warningMessage: {
    fontSize: fontSize.sm,
  },
  layoutCard: {
    overflow: "hidden",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  layoutSideSelector: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  layoutValidationError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  layoutValidationErrorText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
