import { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconAlertTriangle, IconDeviceFloppy, IconPackage } from "@tabler/icons-react-native";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BatchOperationResultDialog } from "@/components/common/batch-operation-result-dialog";

import { useActivities, useActivityBatchMutations } from "@/hooks";
import { useUsersInfiniteMobile } from "@/hooks/use-users-infinite-mobile";
import { useTheme } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { routeToMobilePath } from "@/utils/route-mapper";
import {
  routes,
  ACTIVITY_OPERATION,
  ACTIVITY_OPERATION_LABELS,
  ACTIVITY_REASON,
  ACTIVITY_REASON_LABELS,
  USER_STATUS,
  SECTOR_PRIVILEGES
} from "@/constants";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

import type { Activity, BatchOperationResult } from "@/types";

// Schema for batch edit form
const activityBatchEditSchema = z.object({
  activities: z.array(
    z.object({
      id: z.string(),
      data: z.object({
        quantity: z.number().positive().min(0.01, "Quantidade deve ser maior que 0"),
        operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND] as const),
        reason: z.string().nullable().optional(),
        userId: z.string().nullable().optional(),
      }),
    }),
  ),
});

type ActivityBatchEditFormData = z.infer<typeof activityBatchEditSchema>;

export default function BatchEditMovementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ids: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [batchResult, setBatchResult] = useState<any | null>(null);

  const { batchUpdateAsync } = useActivityBatchMutations();

  // Parse activity IDs from URL params
  const activityIds = useMemo(() => {
    if (!params.ids) return [];
    return params.ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch activities to edit
  const {
    data: response,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useActivities({
    where: {
      id: { in: activityIds },
    },
    include: {
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      user: {
        include: {
          position: true,
        },
      },
    },
    enabled: activityIds.length > 0,
  });

  // Fetch users for dropdown
  const { data: usersData, isLoading: isLoadingUsers } = useUsersInfiniteMobile({
    statuses: [
      USER_STATUS.EXPERIENCE_PERIOD_1,
      USER_STATUS.EXPERIENCE_PERIOD_2,
      USER_STATUS.EFFECTED,
    ],
    orderBy: { name: "asc" },
    limit: 100,
  });

  const activities = response?.data || [];
  const users = usersData?.pages?.flatMap((page) => page.data) || [];

  const hasValidActivities = activities.length > 0;
  const allActivitiesFound = activities.length === activityIds.length;

  // Initialize form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ActivityBatchEditFormData>({
    resolver: zodResolver(activityBatchEditSchema),
    mode: "onChange",
    defaultValues: {
      activities: activities.map((activity) => ({
        id: activity.id,
        data: {
          quantity: activity.quantity,
          operation: activity.operation,
          reason: activity.reason || null,
          userId: activity.userId || null,
        },
      })),
    },
  });

  // Watch all form values
  const watchedActivities = watch("activities");

  // Submit handler
  const onSubmit = async (data: ActivityBatchEditFormData) => {
    // Show confirmation dialog
    Alert.alert(
      "Confirmar Edição em Lote",
      `Você está prestes a atualizar ${activities.length} movimentação${activities.length !== 1 ? "ões" : ""}. Esta ação não pode ser desfeita. Deseja continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () => performBatchUpdate(data),
        },
      ]
    );
  };

  const performBatchUpdate = async (data: ActivityBatchEditFormData) => {
    setIsSubmitting(true);
    try {
      const updateActivities = data.activities.map((activity) => ({
        id: activity.id,
        data: {
          quantity: activity.data.quantity,
          operation: activity.data.operation,
          reason: activity.data.reason || undefined,
          userId: activity.data.userId || undefined,
        },
      }));

      const batchPayload = { activities: updateActivities };
      const result = await batchUpdateAsync(batchPayload);

      if (result?.data) {
        const { totalSuccess, totalFailed } = result.data;

        // Transform to BatchOperationResult format (for dialog)
        const batchOperationResult = {
          success: totalFailed === 0,
          successCount: totalSuccess,
          failedCount: totalFailed,
          errors:
            result.data.failed?.map(
              (f: { id?: string; error: string }) =>
                `${
                  activities.find((a) => a.id === f.id)?.item?.name || "Movimentação"
                }: ${f.error}`
            ) || [],
        };

        setBatchResult(batchOperationResult);
        setShowResultDialog(true);

        // Show toast notification
        if (totalSuccess > 0) {
          toast.success(
            `${totalSuccess} movimentação${totalSuccess !== 1 ? "ões" : ""} atualizada${totalSuccess !== 1 ? "s" : ""} com sucesso`
          );
        }

        if (totalFailed > 0) {
          toast.error(
            `${totalFailed} movimentação${totalFailed !== 1 ? "ões" : ""} falhou${totalFailed !== 1 ? "aram" : ""} ao atualizar`
          );
        }
      } else {
        toast.success("Movimentações atualizadas com sucesso");
        router.replace(routeToMobilePath(routes.inventory.activities.list) as any);
      }
    } catch (error: any) {
      console.error("Error during batch update:", error);
      toast.error(error.message || "Erro ao atualizar movimentações");

      // Show error in dialog
      setBatchResult({
        success: false,
        successCount: 0,
        failedCount: activityIds.length,
        errors: ["Erro ao processar a atualização em lote"],
      });
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Descartar Alterações?",
        "Você tem alterações não salvas. Deseja descartar?",
        [
          { text: "Cancelar", style: "cancel" },
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

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    if (batchResult?.success || (batchResult?.successCount ?? 0) > 0) {
      // Navigate back to list if there were any successes
      router.replace(routeToMobilePath(routes.inventory.activities.list) as any);
    }
  };

  // Loading state
  if (isLoadingActivities || isLoadingUsers) {
    return <LoadingScreen message="Carregando movimentações..." />;
  }

  // No IDs provided
  if (activityIds.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.errorScrollContent}>
          <Card style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                Nenhuma Movimentação Selecionada
              </ThemedText>
              <ThemedText
                style={[styles.errorDescription, { color: colors.mutedForeground }]}
              >
                Nenhuma movimentação foi selecionada para edição em lote.
              </ThemedText>
              <Button onPress={handleCancel} variant="outline" style={styles.errorButton}>
                Voltar para Lista
              </Button>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Error or no valid activities
  if (activitiesError || !hasValidActivities) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.errorScrollContent}>
          <Card style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                Erro ao Carregar Movimentações
              </ThemedText>
              <ThemedText
                style={[styles.errorDescription, { color: colors.mutedForeground }]}
              >
                {activitiesError
                  ? "Ocorreu um erro ao carregar as movimentações selecionadas."
                  : "As movimentações selecionadas não foram encontradas."}
              </ThemedText>
              {!allActivitiesFound && activities.length > 0 && (
                <Card
                  style={[
                    styles.warningCard,
                    {
                      backgroundColor: colors.warning + "20",
                      borderColor: colors.warning,
                    },
                  ]}
                >
                  <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                    Apenas {activities.length} de {activityIds.length} movimentações foram
                    encontradas. As movimentações não encontradas podem ter sido excluídas.
                  </ThemedText>
                </Card>
              )}
              <Button onPress={handleCancel} variant="outline" style={styles.errorButton}>
                Voltar para Lista
              </Button>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Get operation options
  const operationOptions = Object.values(ACTIVITY_OPERATION).map((operation) => ({
    value: operation,
    label: ACTIVITY_OPERATION_LABELS[operation],
  }));

  // Get reason options (with system option for no reason)
  const reasonOptions = [
    { value: "system", label: "Automático (pelo sistema)" },
    ...Object.values(ACTIVITY_REASON).map((reason) => ({
      value: reason,
      label: ACTIVITY_REASON_LABELS[reason],
    })),
  ];

  // Get user options (with none option)
  const userOptions = [
    { value: "none", label: "Nenhum usuário" },
    ...users.map((user) => ({
      value: user.id,
      label: user.name,
    })),
  ];

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Info */}
        <Card style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.headerContent}>
            <View style={styles.pulseContainer}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
                Editando {activities.length} movimentaç{activities.length === 1 ? "ão" : "ões"}
              </ThemedText>
              <ThemedText
                style={[styles.headerDescription, { color: colors.mutedForeground }]}
              >
                As alterações serão aplicadas a todas as movimentações listadas abaixo
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Activity Items */}
        {activities.map((activity, index) => {
          const watchedActivity = watchedActivities[index];

          return (
            <Card
              key={activity.id}
              style={[styles.activityCard, { backgroundColor: colors.card }]}
            >
              {/* Item Info */}
              <View
                style={[
                  styles.itemInfoContainer,
                  { borderBottomColor: colors.border },
                ]}
              >
                <ThemedText style={[styles.itemName, { color: colors.foreground }]}>
                  {activity.item?.uniCode
                    ? `${activity.item.uniCode} - ${activity.item.name}`
                    : activity.item?.name || "Item não encontrado"}
                </ThemedText>
                {activity.user && (
                  <ThemedText
                    style={[styles.itemUser, { color: colors.mutedForeground }]}
                  >
                    Usuário: {activity.user.name}
                  </ThemedText>
                )}
              </View>

              {/* Quantity Input */}
              <View style={styles.fieldContainer}>
                <Label>
                  Quantidade <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`activities.${index}.data.quantity`}
                  render={({ field: { value, onChange } }) => (
                    <View>
                      <Input
                        type="decimal"
                        value={value}
                        onChange={onChange}
                        placeholder="0.00"
                        keyboardType="numeric"
                        error={!!errors.activities?.[index]?.data?.quantity}
                      />
                      {errors.activities?.[index]?.data?.quantity && (
                        <ThemedText
                          style={[styles.errorText, { color: colors.destructive }]}
                        >
                          {errors.activities[index]?.data?.quantity?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Operation Selector */}
              <View style={styles.fieldContainer}>
                <Label>
                  Operação <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`activities.${index}.data.operation`}
                  render={({ field: { value, onChange } }) => (
                    <View>
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a operação" />
                        </SelectTrigger>
                        <SelectContent>
                          {operationOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              label={option.label}
                            />
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.activities?.[index]?.data?.operation && (
                        <ThemedText
                          style={[styles.errorText, { color: colors.destructive }]}
                        >
                          {errors.activities[index]?.data?.operation?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Reason Selector */}
              <View style={styles.fieldContainer}>
                <Label>Motivo</Label>
                <Controller
                  control={control}
                  name={`activities.${index}.data.reason`}
                  render={({ field: { value, onChange } }) => (
                    <View>
                      <Select
                        value={value || "system"}
                        onValueChange={(val) =>
                          onChange(val === "system" ? null : val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {reasonOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              label={option.label}
                            />
                          ))}
                        </SelectContent>
                      </Select>
                    </View>
                  )}
                />
              </View>

              {/* User Selector */}
              <View style={styles.fieldContainer}>
                <Label>Usuário</Label>
                <Controller
                  control={control}
                  name={`activities.${index}.data.userId`}
                  render={({ field: { value, onChange } }) => (
                    <View>
                      <Select
                        value={value || "none"}
                        onValueChange={(val) =>
                          onChange(val === "none" ? null : val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {userOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              label={option.label}
                            />
                          ))}
                        </SelectContent>
                      </Select>
                    </View>
                  )}
                />
              </View>
            </Card>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            onPress={handleCancel}
            variant="outline"
            style={[styles.button, styles.cancelButton]}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={[styles.button, styles.submitButton]}
            disabled={isSubmitting || !isDirty}
            icon={<IconDeviceFloppy size={20} color="#ffffff" />}
          >
            <ThemedText style={{ color: "#fff" }}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </ThemedText>
          </Button>
        </View>
      </ScrollView>

      {/* Batch Operation Result Dialog */}
      <BatchOperationResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={batchResult}
        onConfirm={handleResultDialogClose}
        itemType="movimentações"
        itemTypeSingular="movimentação"
        title="Resultado da Edição em Lote"
        description="Resumo da operação de atualização"
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
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  errorScrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: "center",
  },
  errorCard: {
    padding: spacing.lg,
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  errorButton: {
    minWidth: 120,
  },
  warningCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  warningText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  headerCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  pulseContainer: {
    paddingTop: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  headerDescription: {
    fontSize: fontSize.xs,
  },
  activityCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  itemInfoContainer: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  itemUser: {
    fontSize: fontSize.sm,
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
