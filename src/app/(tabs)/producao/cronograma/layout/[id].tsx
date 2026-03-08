import { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SimpleFormField } from "@/components/ui/simple-form-field";
import { MultiStepFormContainer } from "@/components/forms";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { LayoutForm } from "@/components/production/layout/layout-form";
import { useTaskDetail, useLayoutsByTruck, useLayoutMutations, useScreenReady} from '@/hooks';
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { navigationTracker } from "@/utils/navigation-tracker";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, TRUCK_MANUFACTURER } from "@/constants";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { canEditLayouts, canEditLayoutsOnly, canEditLayoutForTask } from "@/utils/permissions/entity-permissions";
import type { LayoutCreateFormData, TruckCreateFormData } from "@/schemas";
import type { FormStep } from "@/components/ui/form-steps";
import { Icon } from "@/components/ui/icon";
import { truckService } from "@/api-client";

const WIZARD_STEPS: FormStep[] = [
  { id: 1, name: "Motorista", description: "Lado esquerdo" },
  { id: 2, name: "Sapo", description: "Lado direito" },
  { id: 3, name: "Traseira", description: "Parte traseira" },
  { id: 4, name: "Resumo", description: "Revisar e salvar" },
];

const SIDE_FOR_STEP: Record<number, "left" | "right" | "back"> = {
  1: "left",
  2: "right",
  3: "back",
};

export default function LayoutOnlyEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { goBack } = useNavigationHistory();
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
      // Only essential fields for layout page - optimized with select patterns
      customer: {
        select: {
          id: true,
          fantasyName: true,
        }
      },
      truck: {
        select: {
          id: true,
          plate: true,
          chassisNumber: true,
          category: true,
          implementType: true,
        }
      },
    },
  });

  useScreenReady(!isLoadingTask);

  const task = response?.data;

  // Fetch truck layouts if task has a truck
  const truckId = task?.truck?.id;
  const layoutsQuery = useLayoutsByTruck(truckId || "", {
    include: { layoutSections: true },
    enabled: !!truckId,
  });
  const layoutsData = layoutsQuery.data;
  const isLoadingLayouts = layoutsQuery.isLoading;

  // Debug the layouts query
  console.log('[Layout Page] Layouts Query:', {
    truckId,
    enabled: !!truckId,
    isLoading: layoutsQuery.isLoading,
    isFetching: layoutsQuery.isFetching,
    isSuccess: layoutsQuery.isSuccess,
    isError: layoutsQuery.isError,
    hasData: !!layoutsQuery.data,
    dataKeys: layoutsQuery.data ? Object.keys(layoutsQuery.data) : null,
  });

  // Layout state - Include photoUri for new photos that need to be uploaded
  type LayoutWithPhoto = LayoutCreateFormData & { photoUri?: string };
  const [currentStep, setCurrentStep] = useState(1);
  const selectedLayoutSide = SIDE_FOR_STEP[currentStep] || "left";
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

  const goNext = useCallback(() => {
    // On step 2→3, warn about width balance if there's an error
    if (currentStep === 2 && layoutWidthError) {
      Alert.alert(
        "Aviso de Largura",
        layoutWidthError,
        [
          { text: "Corrigir", style: "cancel" },
          { text: "Continuar mesmo assim", onPress: () => setCurrentStep((s) => s + 1) },
        ]
      );
      return false;
    }
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, layoutWidthError]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

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
          activeTruckId = truckResponse.data!.id;
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
        const layoutData = layouts[side];

        if (layoutData && layoutData.layoutSections && layoutData.layoutSections.length > 0) {
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
      // Navigate back to the correct list based on navigation source
      const source = navigationTracker.getSource();
      const fallbackRoute = routeToMobilePath(routes.production.schedule.root);
      router.replace((source || fallbackRoute) as any);
    } catch (error: any) {
      console.error("[LayoutOnlyEdit] Error saving layout:", error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    goBack();
  };

  // Check if user can edit this specific task's layout (led sector check)
  const canEditThisTaskLayout = canEditLayoutForTask(user, task?.sectorId);

  // Debug logging
  console.log('[Layout Page] State:', {
    checkingPermission,
    hasUser: !!user,
    hasTask: !!task,
    hasTruck: !!task?.truck,
    truckId: task?.truck?.id,
    isLoadingTask,
    isLoadingLayouts,
    layoutsQueryEnabled: !!truckId,
    canEditLayout,
    canEditThisTaskLayout,
    taskSectorId: task?.sectorId,
    userPrivilege: user?.sector?.privileges,
  });

  // Permission check effect - redirect if no permission for this task
  useEffect(() => {
    console.log('[Layout Page] Permission check effect:', {
      userDefined: user !== undefined,
      taskDefined: task !== undefined,
      isLoadingTask,
    });

    if (user !== undefined && task !== undefined && !isLoadingTask) {
      setCheckingPermission(false);

      // Check basic layout permission first
      if (!canEditLayout) {
        console.log('[Layout Page] No basic layout permission');
        Alert.alert("Acesso negado", "Voce nao tem permissao para editar layouts");
        const source = navigationTracker.getSource();
        router.replace((source || "/(tabs)/producao/cronograma") as any);
        return;
      }

      // Check if user can edit THIS task's layout (led sector validation)
      if (!canEditThisTaskLayout) {
        console.log('[Layout Page] Cannot edit this task layout');
        Alert.alert("Acesso negado", "Voce so pode editar layouts de tarefas do seu setor liderado ou tarefas sem setor definido");
        const source = navigationTracker.getSource();
        router.replace((source || "/(tabs)/producao/cronograma") as any);
      }
    }
  }, [user, task, isLoadingTask, canEditLayout, canEditThisTaskLayout, router]);

  // Show skeleton while checking permission or loading data
  // TEMPORARILY: Skip layouts loading check to see if that's the issue
  const shouldCheckLayoutsLoading = false; // !!truckId;
  const stillLoadingLayouts = shouldCheckLayoutsLoading && isLoadingLayouts;

  if (checkingPermission || !user || isLoadingTask) {
    console.log('[Layout Page] Showing skeleton - still loading', {
      checkingPermission,
      noUser: !user,
      isLoadingTask,
      stillLoadingLayouts,
    });
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.skeletonScrollContent}
        >
          {/* Task Identification Card Skeleton */}
          <Card style={styles.skeletonInfoCard}>
            {/* Card header row: icon + title */}
            <View style={styles.skeletonCardHeader}>
              <SkeletonCard height={20} width={20} borderRadius={4} />
              <SkeletonCard height={20} width={180} borderRadius={4} />
            </View>
            {/* 3 disabled input fields */}
            <View style={styles.skeletonCardContent}>
              <View style={styles.skeletonFieldGroup}>
                <SkeletonCard height={14} width={100} borderRadius={3} />
                <SkeletonCard height={40} width="100%" borderRadius={6} />
              </View>
              <View style={styles.skeletonFieldGroup}>
                <SkeletonCard height={14} width={120} borderRadius={3} />
                <SkeletonCard height={40} width="100%" borderRadius={6} />
              </View>
              <View style={styles.skeletonFieldGroup}>
                <SkeletonCard height={14} width={80} borderRadius={3} />
                <SkeletonCard height={40} width="100%" borderRadius={6} />
              </View>
            </View>
          </Card>

          {/* Layout Card Skeleton */}
          <Card style={styles.skeletonLayoutCard}>
            {/* Card header row: icon + title + badge */}
            <View style={styles.skeletonCardHeader}>
              <SkeletonCard height={20} width={20} borderRadius={4} />
              <SkeletonCard height={20} width={160} borderRadius={4} />
            </View>
            {/* Side selector buttons row */}
            <View style={styles.skeletonCardContent}>
              <View style={styles.skeletonSideSelector}>
                <SkeletonCard height={36} borderRadius={6} style={{ flex: 1 }} />
                <SkeletonCard height={36} borderRadius={6} style={{ flex: 1 }} />
                <SkeletonCard height={36} borderRadius={6} style={{ flex: 1 }} />
              </View>
              {/* Layout form area */}
              <SkeletonCard height={280} width="100%" borderRadius={8} />
            </View>
          </Card>
        </ScrollView>

        {/* Action bar skeleton at bottom */}
        <View style={styles.skeletonActionBar}>
          <SkeletonCard height={44} borderRadius={6} style={{ flex: 1 }} />
          <SkeletonCard height={44} borderRadius={6} style={{ flex: 1 }} />
        </View>
      </ThemedView>
    );
  }

  // If no permission after loading, return null (the useEffect will handle redirect)
  if (!canEditLayout || !canEditThisTaskLayout) {
    console.log('[Layout Page] No permission - redirecting');
    return null;
  }

  console.log('[Layout Page] Rendering main content');

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
      <MultiStepFormContainer
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onPrevStep={goPrev}
        onNextStep={goNext}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting || isSavingTruckLayout}
        canProceed={true}
        canSubmit={modifiedLayoutSides.size > 0 && !layoutWidthError}
        submitLabel={hasExistingLayout ? "Salvar Alteracoes" : "Cadastrar Layout"}
        scrollable={true}
      >
        {/* Steps 1-3: Layout Form for each side */}
        {currentStep <= 3 && (
          <View style={styles.content}>
            {/* Current side label */}
            <ThemedText style={styles.sideHeaderTitle}>
              {WIZARD_STEPS[currentStep - 1].name}
            </ThemedText>

            <LayoutForm
              selectedSide={selectedLayoutSide}
              layouts={layouts}
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
        )}

        {/* Step 4: Review Summary */}
        {currentStep === 4 && (
          <View style={styles.content}>
            {/* Task Identification Card */}
            <Card style={styles.infoCard}>
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <Icon name="file-text" size={20} color={colors.primary} />
                <ThemedText style={styles.cardTitle}>Identificacao da Tarefa</ThemedText>
              </View>
              <View style={styles.cardContent}>
                <SimpleFormField label="Logomarca">
                  <Input
                    value={task.name}
                    editable={false}
                    style={[styles.disabledInput, { backgroundColor: colors.muted }]}
                  />
                </SimpleFormField>
                <SimpleFormField label="Numero de Serie">
                  <Input
                    value={task.serialNumber || task.truck?.plate || "Nao informado"}
                    editable={false}
                    style={[styles.disabledInput, { backgroundColor: colors.muted }]}
                  />
                </SimpleFormField>
                {task.customer && (
                  <SimpleFormField label="Razão Social">
                    <Input
                      value={task.customer.corporateName || task.customer.fantasyName || ""}
                      editable={false}
                      style={[styles.disabledInput, { backgroundColor: colors.muted }]}
                    />
                  </SimpleFormField>
                )}
              </View>
            </Card>

            {/* Per-side Summary Cards */}
            {(["left", "right", "back"] as const).map((side) => {
              const layout = layouts[side];
              const sideLabel = side === "left" ? "Motorista" : side === "right" ? "Sapo" : "Traseira";
              const sections = layout?.layoutSections || [];
              const totalWidth = sections.reduce((sum, s) => sum + (s.width || 0), 0);
              const doorCount = sections.filter((s) => s.isDoor).length;
              const isModified = modifiedLayoutSides.has(side);

              return (
                <Card key={side} style={styles.reviewCard}>
                  <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText style={styles.cardTitle}>{sideLabel}</ThemedText>
                    {isModified && (
                      <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
                          Modificado
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View style={styles.reviewCardContent}>
                    <View style={styles.reviewRow}>
                      <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Altura</ThemedText>
                      <ThemedText style={styles.reviewValue}>{layout?.height ? `${(layout.height * 100).toFixed(0)}cm` : "-"}</ThemedText>
                    </View>
                    <View style={styles.reviewRow}>
                      <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Largura total</ThemedText>
                      <ThemedText style={styles.reviewValue}>{totalWidth ? `${(totalWidth * 100).toFixed(0)}cm` : "-"}</ThemedText>
                    </View>
                    {side !== "back" && (
                      <View style={styles.reviewRow}>
                        <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Portas</ThemedText>
                        <ThemedText style={styles.reviewValue}>{doorCount}</ThemedText>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}

            {/* Width Balance Error */}
            {layoutWidthError && (
              <View style={[styles.layoutValidationError, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]}>
                <Icon name="alert-triangle" size={18} color={colors.destructive} />
                <ThemedText style={[styles.layoutValidationErrorText, { color: colors.destructive }]}>
                  {layoutWidthError}
                </ThemedText>
              </View>
            )}

            {/* Modified sides info */}
            {modifiedLayoutSides.size > 0 && (
              <View style={[styles.modifiedInfo, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Icon name="info" size={18} color={colors.primary} />
                <ThemedText style={[styles.modifiedInfoText, { color: colors.primary }]}>
                  {modifiedLayoutSides.size === 3
                    ? "Todos os lados serão salvos"
                    : `${modifiedLayoutSides.size} lado(s) modificado(s) será(ão) salvo(s)`}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </MultiStepFormContainer>
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
  skeletonScrollContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  skeletonInfoCard: {
    overflow: 'hidden',
  },
  skeletonLayoutCard: {
    overflow: 'hidden',
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  skeletonCardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonFieldGroup: {
    gap: spacing.xs,
  },
  skeletonSideSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  skeletonActionBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
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
  sideHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  reviewCard: {
    overflow: "hidden",
  },
  reviewCardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewLabel: {
    fontSize: fontSize.sm,
  },
  reviewValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  modifiedInfoText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
});
