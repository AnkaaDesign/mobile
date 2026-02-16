import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { TaskFormWithProvider as TaskForm } from "@/components/production/task/form/task-form-with-provider";
import { SkeletonCard } from "@/components/ui/loading";
import { useTaskMutations, useLayoutsByTruck, useTaskDetail } from "@/hooks";
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
  } = useTaskDetail(id!, {
    include: {
      // Only include essential fields for edit form - optimized with select patterns
      customer: {
        select: {
          id: true,
          fantasyName: true,
        }
      },
      representatives: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
        }
      },
      generalPainting: {
        select: {
          id: true,
          name: true,
          hex: true,
        }
      },
      logoPaints: {
        select: {
          id: true,
          name: true,
          hex: true,
        }
      },
      serviceOrders: {
        select: {
          id: true,
          description: true,
          status: true,
          statusOrder: true,
          type: true,
          assignedToId: true,
          observation: true,
          startedAt: true,
          finishedAt: true,
          shouldSync: true,
        }
      },
      sector: {
        select: {
          id: true,
          name: true,
        }
      },
      truck: {
        select: {
          id: true,
          plate: true,
          chassisNumber: true,
          category: true,
          implementType: true,
          spot: true,
        }
      },
      observation: {
        select: {
          id: true,
          description: true,
          files: {
            select: {
              id: true,
              filename: true,
              mimetype: true,
              size: true,
            }
          },
        }
      },
      pricing: {
        select: {
          id: true,
          status: true,
          expiresAt: true,
          subtotal: true,
          discountType: true,
          discountValue: true,
          total: true,
          paymentCondition: true,
          downPaymentDate: true,
          customPaymentText: true,
          guaranteeYears: true,
          customGuaranteeText: true,
          layoutFileId: true,
          layoutFile: true,
          customForecastDays: true,
          simultaneousTasks: true,
          discountReference: true,
          invoicesToCustomerIds: true,
          invoicesToCustomers: {
            select: {
              id: true,
              fantasyName: true,
            }
          },
          items: {
            select: {
              id: true,
              description: true,
              observation: true,
              amount: true,
            }
          },
        }
      },
    }
  });

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
      console.log('[EditSchedule] Raw form data:', JSON.stringify(data, null, 2));

      // Process form data: filter empty items and prepare for API
      const processedData = processFormDataForSubmission(data, task);
      console.log('[EditSchedule] Processed data:', JSON.stringify(processedData, null, 2));

      // Check if there are any actual changes
      if (Object.keys(processedData).length === 0) {
        console.log('[EditSchedule] No changes detected, skipping update');
        handleNavigateBack();
        return;
      }

      const result = await updateAsync({ id, data: processedData });
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

  /**
   * Process form data before submission:
   * 1. Filter empty service orders (no description)
   * 2. Filter empty pricing items (no description)
   * 3. Filter empty airbrushings (no meaningful data)
   * 4. Compare with original task and only include changed fields
   *
   * This matches the web version's useEditForm + handleFormSubmit logic
   */
  const processFormDataForSubmission = (formData: any, originalTask: any): any => {
    const processed: any = {};

    // Helper: Check if a value has changed (handles dates, arrays, objects)
    const hasChanged = (current: any, original: any): boolean => {
      // Normalize null/undefined/empty
      const normalize = (val: any) => {
        if (val === null || val === undefined || val === '') return null;
        return val;
      };

      const curr = normalize(current);
      const orig = normalize(original);

      if (curr === null && orig === null) return false;
      if (curr === null || orig === null) return true;

      // Date comparison
      if (curr instanceof Date || orig instanceof Date) {
        const currTime = curr instanceof Date ? curr.getTime() : new Date(curr).getTime();
        const origTime = orig instanceof Date ? orig.getTime() : new Date(orig).getTime();
        return currTime !== origTime;
      }

      // Array comparison
      if (Array.isArray(curr) && Array.isArray(orig)) {
        return JSON.stringify(curr) !== JSON.stringify(orig);
      }

      // Object comparison
      if (typeof curr === 'object' && typeof orig === 'object') {
        return JSON.stringify(curr) !== JSON.stringify(orig);
      }

      return curr !== orig;
    };

    // Helper: Filter empty service orders
    const filterServiceOrders = (orders: any[]): any[] => {
      if (!orders || !Array.isArray(orders)) return [];
      return orders.filter(order => {
        // Keep if it has an ID (existing record) - might have status/field changes
        if (order.id && !order.id.startsWith('temp-')) return true;
        // For new service orders (no ID), require description >= 3 chars
        return order.description && order.description.trim().length >= 3;
      });
    };

    // Helper: Filter empty pricing items
    const filterPricingItems = (items: any[]): any[] => {
      if (!items || !Array.isArray(items)) return [];
      return items.filter(item => {
        // Keep if it has an ID (existing record)
        if (item.id && !item.id.startsWith('temp-')) return true;
        // For new items, require description
        return item.description && item.description.trim() !== '';
      });
    };

    // Process simple scalar fields
    const scalarFields = [
      'name', 'status', 'serialNumber', 'details', 'commission',
      'customerId', 'sectorId', 'paintId'
    ];

    for (const field of scalarFields) {
      if (formData[field] !== undefined && hasChanged(formData[field], originalTask[field])) {
        processed[field] = formData[field];
      }
    }

    // Process date fields
    const dateFields = ['entryDate', 'term', 'forecastDate', 'startedAt', 'finishedAt'];
    for (const field of dateFields) {
      if (formData[field] !== undefined && hasChanged(formData[field], originalTask[field])) {
        processed[field] = formData[field];
      }
    }

    // Process negotiatingWith (embedded object)
    if (formData.negotiatingWith !== undefined) {
      const orig = originalTask.negotiatingWith || { name: null, phone: null };
      if (hasChanged(formData.negotiatingWith, orig)) {
        processed.negotiatingWith = formData.negotiatingWith;
      }
    }

    // Process truck (embedded object)
    if (formData.truck !== undefined) {
      const orig = originalTask.truck || {};
      if (hasChanged(formData.truck, orig)) {
        processed.truck = formData.truck;
      }
    }

    // Process paintIds (logo paints)
    if (formData.paintIds !== undefined) {
      const origIds = (originalTask.logoPaints || []).map((p: any) => p.id).sort();
      const currIds = [...(formData.paintIds || [])].sort();
      if (JSON.stringify(currIds) !== JSON.stringify(origIds)) {
        processed.paintIds = formData.paintIds;
      }
    }

    // Process serviceOrders - filter empty and check for changes
    if (formData.serviceOrders !== undefined) {
      const filteredOrders = filterServiceOrders(formData.serviceOrders);
      const origOrders = (originalTask.serviceOrders || []).map((s: any) => ({
        id: s.id,
        description: s.description,
        status: s.status,
        statusOrder: s.statusOrder,
        type: s.type,
        assignedToId: s.assignedToId,
        observation: s.observation,
      }));

      // Compare filtered orders with original (ignoring non-essential fields)
      const currForCompare = filteredOrders.map((s: any) => ({
        id: s.id,
        description: s.description,
        status: s.status,
        statusOrder: s.statusOrder,
        type: s.type,
        assignedToId: s.assignedToId,
        observation: s.observation,
      }));

      if (JSON.stringify(currForCompare) !== JSON.stringify(origOrders)) {
        processed.serviceOrders = filteredOrders;
        console.log('[EditSchedule] Service orders changed:', {
          original: origOrders.length,
          filtered: filteredOrders.length,
        });
      }
    }

    // Process pricing - filter empty items and check for changes
    if (formData.pricing !== undefined) {
      const currPricing = formData.pricing;
      const origPricing = originalTask.pricing;

      if (currPricing && currPricing.items) {
        currPricing.items = filterPricingItems(currPricing.items);
      }

      // Only include pricing if it has valid items or if there are changes
      if (currPricing?.items?.length > 0 || (origPricing && hasChanged(currPricing, origPricing))) {
        processed.pricing = currPricing;
      }
    }

    // Process observation
    if (formData.observation !== undefined) {
      if (hasChanged(formData.observation, originalTask.observation)) {
        processed.observation = formData.observation;
      }
    }

    // Process file IDs (artworkIds, baseFileIds, etc.)
    // These are handled by their respective sections and passed through
    const fileIdFields = ['artworkIds', 'baseFileIds', 'budgetIds', 'invoiceIds', 'receiptIds'];
    for (const field of fileIdFields) {
      if (formData[field] !== undefined) {
        processed[field] = formData[field];
      }
    }

    // representativeIds and newRepresentatives are handled by RepresentativesSection
    // They are only set when there's an actual change (via shouldDirty flag)
    if (formData.representativeIds !== undefined) {
      processed.representativeIds = formData.representativeIds;
    }
    if (formData.newRepresentatives !== undefined && formData.newRepresentatives.length > 0) {
      processed.newRepresentatives = formData.newRepresentatives;
    }

    return processed;
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
          // Initialize serviceOrders with default empty row if none exist (matches web)
          serviceOrders: task.serviceOrders && task.serviceOrders.length > 0
            ? task.serviceOrders.map((s) => ({
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
              }))
            : [{
                // Default empty service order row
                status: 'PENDING',
                statusOrder: 1,
                description: '',
                type: 'PRODUCTION',
                assignedToId: null,
                observation: null,
                startedAt: null,
                finishedAt: null,
              }],
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
          // Include pricing for edit mode (with default empty item row, matches web)
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
            customForecastDays: (task as any).pricing.customForecastDays || null,
            simultaneousTasks: (task as any).pricing.simultaneousTasks || null,
            discountReference: (task as any).pricing.discountReference || null,
            invoicesToCustomerIds: (task as any).pricing.invoicesToCustomers?.map((c: any) => c.id) || [],
            // Include default empty row if no items exist (matches web)
            items: (task as any).pricing.items && (task as any).pricing.items.length > 0
              ? (task as any).pricing.items.map((item: any) => ({
                  id: item.id,
                  description: item.description || '',
                  observation: item.observation || null,
                  amount: item.amount ?? null,
                  shouldSync: true,
                }))
              : [{ description: '', amount: null, observation: null, shouldSync: true }],
          } : {
            // Default pricing structure when no pricing exists (matches web)
            status: 'DRAFT',
            expiresAt: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 30);
              date.setHours(23, 59, 59, 999);
              return date;
            })(),
            subtotal: 0,
            discountType: 'NONE',
            discountValue: null,
            total: 0,
            paymentCondition: null,
            downPaymentDate: null,
            customPaymentText: null,
            guaranteeYears: null,
            customGuaranteeText: null,
            layoutFileId: null,
            layoutFile: null,
            customForecastDays: null,
            simultaneousTasks: null,
            discountReference: null,
            invoicesToCustomerIds: [],
            items: [{ description: '', amount: null, observation: null, shouldSync: true }],
          },
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
