import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { TaskFormWithProviderUnified as TaskForm } from "@/components/production/task/form/task-form-with-provider-unified";
import { SkeletonCard } from "@/components/ui/loading";
import { useTaskMutations, useLayoutsByTruck } from "@/hooks";
import { useTaskDetailOptimized } from "@/hooks/use-task-detail-optimized";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";

export default function EditScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { goBack } = useNavigationHistory();
  const { updateAsync, isLoading } = useTaskMutations();
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Check permissions - ADMIN, FINANCIAL, COMMERCIAL, and LOGISTIC can edit tasks
  const userPrivilege = user?.sector?.privileges;
  const canEdit = userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
                  userPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
                  userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
                  userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;

  useEffect(() => {
    // Wait for user to load
    if (user !== undefined) {
      setCheckingPermission(false);

      // Redirect if no permission
      if (!canEdit) {
        Alert.alert(
          "Acesso negado",
          "Você não tem permissão para editar tarefas"
        );
        router.replace("/(tabs)/producao/cronograma");
      }
    }
  }, [user, canEdit, router]);

  // Use optimized task detail hook - loads minimal data for edit form
  const {
    data: response,
    isLoading: isLoadingTask,
    error,
  } = useTaskDetailOptimized(id!);

  const task = response?.data;

  // Fetch truck layouts if task has a truck
  const truckId = task?.truck?.id;
  const { data: layoutsData } = useLayoutsByTruck(truckId || "", {
    include: { layoutSections: true },
    enabled: !!truckId,
  });

  // Transform layout data from backend format to LayoutCreateFormData format
  // Must be before conditional returns to maintain hook order
  const existingLayouts = React.useMemo(() => {
    if (!layoutsData) return undefined;

    const layouts: any = {};

    // Transform left side layout
    if (layoutsData.leftSideLayout?.layoutSections) {
      layouts.left = {
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
      layouts.right = {
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
      layouts.back = {
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

    return Object.keys(layouts).length > 0 ? layouts : undefined;
  }, [layoutsData]);

  const handleNavigateBack = () => {
    // Use router.back() for proper stack navigation
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to detail page if can't go back
      router.push(`/(tabs)/producao/cronograma/detalhes/${id}` as any);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!id) return;

    try {
      console.log('[EditSchedule] Starting task update for id:', id);
      console.log('[EditSchedule] Update data:', JSON.stringify(data, null, 2));

      const result = await updateAsync({ id, data });
      console.log('[EditSchedule] API result:', result);

      if (result.success) {
        // API client already shows success alert
        handleNavigateBack();
      } else {
        // API returned failure
        console.error('[EditSchedule] Task update failed:', result);
        Alert.alert(
          "Erro ao atualizar tarefa",
          result?.message || "Não foi possível atualizar a tarefa. Tente novamente."
        );
      }
    } catch (error: any) {
      console.error("[EditSchedule] Error updating task:", error);
      // API client already shows error alert
    }
  };

  const handleCancel = () => {
    handleNavigateBack();
  };

  // If still checking permission or no permission, show skeleton while redirect happens
  if (checkingPermission || !user || !canEdit) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
        </View>
      </ThemedView>
    );
  }

  if (isLoadingTask) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
        </View>
      </ThemedView>
    );
  }

  if (error || !task) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <ThemedText className="text-2xl font-semibold mb-2 text-center">Tarefa não encontrada</ThemedText>
          <ThemedText className="text-muted-foreground mb-4 text-center">
            A tarefa que você está procurando não existe ou foi removida.
          </ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText className="text-white">Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  console.log('[EditScheduleScreen] Existing layouts:', existingLayouts);

  return (
    <ThemedView className="flex-1">
      <TaskForm
        mode="edit"
        task={task}
        initialData={{
          name: task.name,
          customerId: task.customerId || "",
          invoiceToId: task.invoiceToId ?? null,
          negotiatingWith: (task as any).negotiatingWith ?? { name: null, phone: null },
          sectorId: task.sectorId ?? undefined,
          serialNumber: task.serialNumber ?? undefined,
          // truck object matches Prisma schema field names
          truck: {
            plate: task.truck?.plate ?? null,
            chassisNumber: task.truck?.chassisNumber ?? null,
            category: (task.truck as any)?.category ?? null,
            implementType: (task.truck as any)?.implementType ?? null,
            spot: (task.truck as any)?.spot ?? null,
          },
          details: task.details ?? undefined,
          entryDate: task.entryDate ? new Date(task.entryDate) : undefined,
          term: task.term ? new Date(task.term) : undefined,
          forecastDate: task.forecastDate ? new Date(task.forecastDate) : undefined,
          generalPaintingId: task.paintId ?? undefined,
          paintIds: task.logoPaints?.filter((p) => p && p.id).map((p) => p.id) || [],
          serviceOrders: task.serviceOrders?.map((s) => ({
            id: s.id,
            description: s.description,
            status: s.status ?? undefined,
            statusOrder: s.statusOrder,
            type: s.type,
            assignedToId: s.assignedToId || null,
            observation: s.observation || null,
            startedAt: s.startedAt ? new Date(s.startedAt) : null,
            finishedAt: s.finishedAt ? new Date(s.finishedAt) : null,
            shouldSync: (s as any).shouldSync !== false,
          })) || [],
          status: task.status,
          commission: task.commission ?? null,
          startedAt: task.startedAt ? new Date(task.startedAt) : null,
          finishedAt: task.finishedAt ? new Date(task.finishedAt) : null,
          // Include observation with files for edit mode
          observation: task.observation ? {
            description: task.observation.description || "",
            fileIds: (task.observation.files?.map((f) => f.id) || []) as string[],
            files: task.observation.files || [],
          } : null,
          // Include artworks for edit mode
          artworks: (task as any).artworks || [],
          artworkIds: (task as any).artworks?.map((f: any) => f.fileId || f.file?.id || f.id) || [],
          // Include base files for edit mode
          baseFiles: (task as any).baseFiles || [],
          baseFileIds: (task as any).baseFiles?.map((f: any) => f.id) || [],
          // Include pricing for edit mode
          pricing: (task as any).pricing ? {
            id: (task as any).pricing.id,
            status: (task as any).pricing.status || 'DRAFT',
            expiresAt: (task as any).pricing.expiresAt,
            subtotal: (task as any).pricing.subtotal || 0,
            discountType: (task as any).pricing.discountType || 'NONE',
            discountValue: (task as any).pricing.discountValue || null,
            total: (task as any).pricing.total || 0,
            paymentCondition: (task as any).pricing.paymentCondition || null,
            downPaymentDate: (task as any).pricing.downPaymentDate || null,
            customPaymentText: (task as any).pricing.customPaymentText || null,
            guaranteeYears: (task as any).pricing.guaranteeYears || null,
            customGuaranteeText: (task as any).pricing.customGuaranteeText || null,
            layoutFileId: (task as any).pricing.layoutFileId || null,
            layoutFile: (task as any).pricing.layoutFile || null,
            items: (task as any).pricing.items?.map((item: any) => ({
              id: item.id,
              description: item.description || '',
              observation: item.observation || null,
              amount: item.amount ?? null,
              shouldSync: true,
            })) || [],
          } : undefined,
        }}
        initialCustomer={task.customer}
        initialGeneralPaint={task.generalPainting}
        initialLogoPaints={task.logoPaints}
        existingLayouts={existingLayouts}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeleton: {
    height: 200,
  },
});
