import { useCallback, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { SkeletonCard } from "@/components/ui/loading";
// import { showToast } from "@/components/ui/toast";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useExternalWithdrawals, useExternalWithdrawalBatchMutations } from "@/hooks";
import { routeToMobilePath } from "@/utils/route-mapper";
import {
  routes,
  SECTOR_PRIVILEGES,
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  EXTERNAL_WITHDRAWAL_STATUS_ORDER,
} from "@/constants";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react-native";

// Schema for batch edit form
const externalWithdrawalBatchEditSchema = z.object({
  externalWithdrawals: z.array(
    z.object({
      id: z.string(),
      data: z.object({
        status: z.enum([
          EXTERNAL_WITHDRAWAL_STATUS.PENDING,
          EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED,
          EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED,
          EXTERNAL_WITHDRAWAL_STATUS.CHARGED,
          EXTERNAL_WITHDRAWAL_STATUS.CANCELLED,
        ] as const),
        statusOrder: z.number().int().positive().optional(),
        notes: z.string().nullable().optional(),
      }),
    }),
  ),
});

type ExternalWithdrawalBatchEditFormData = z.infer<typeof externalWithdrawalBatchEditSchema>;

export default function BatchEditExternalWithdrawalsScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <BatchEditExternalWithdrawalsScreen />
    </PrivilegeGuard>
  );
}

function BatchEditExternalWithdrawalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ ids: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { batchUpdateAsync } = useExternalWithdrawalBatchMutations();

  // Parse external withdrawal IDs from URL params
  const externalWithdrawalIds = useMemo(() => {
    if (!params.ids) return [];
    return params.ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch external withdrawals to edit
  const {
    data: response,
    isLoading,
    error,
  } = useExternalWithdrawals({
    where: {
      id: { in: externalWithdrawalIds },
    },
    include: {
      items: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    enabled: externalWithdrawalIds.length > 0,
  });

  const externalWithdrawals = response?.data || [];
  const hasValidWithdrawals = externalWithdrawals.length > 0;
  const allWithdrawalsFound = externalWithdrawals.length === externalWithdrawalIds.length;

  // Initialize form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ExternalWithdrawalBatchEditFormData>({
    resolver: zodResolver(externalWithdrawalBatchEditSchema),
    mode: "onChange",
    defaultValues: {
      externalWithdrawals: externalWithdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        data: {
          status: withdrawal.status,
          statusOrder: withdrawal.statusOrder || EXTERNAL_WITHDRAWAL_STATUS_ORDER[withdrawal.status] || 1,
          notes: withdrawal.notes,
        },
      })),
    },
  });

  // Watch all form values
  const watchedWithdrawals = watch("externalWithdrawals");

  // Handle status change with proper order logic
  const handleStatusChange = useCallback(
    (index: number, newStatus: string) => {
      setValue(`externalWithdrawals.${index}.data.status`, newStatus as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue(`externalWithdrawals.${index}.data.statusOrder`, EXTERNAL_WITHDRAWAL_STATUS_ORDER[newStatus] || 1, {
        shouldDirty: true,
      });
    },
    [setValue]
  );

  // Submit handler
  const onSubmit = async (data: ExternalWithdrawalBatchEditFormData) => {
    setIsSubmitting(true);
    try {
      const updateWithdrawals = data.externalWithdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        data: {
          ...withdrawal.data,
          statusOrder: EXTERNAL_WITHDRAWAL_STATUS_ORDER[withdrawal.data.status] || 1,
        },
      }));

      const batchPayload = { externalWithdrawals: updateWithdrawals };
      const result = await batchUpdateAsync(batchPayload);

      if (result?.data) {
        const { totalSuccess, totalFailed } = result.data;

        if (totalFailed === 0) {
          Alert.alert(
            "Sucesso",
            `${totalSuccess} retirada(s) externa(s) atualizada(s) com sucesso!`
          );
          router.replace(routeToMobilePath(routes.inventory.externalWithdrawals.root) as any);
        } else {
          Alert.alert(
            "Erro",
            `${totalSuccess} sucesso(s), ${totalFailed} falha(s)`
          );
        }
      } else {
        Alert.alert(
          "Sucesso",
          "Retiradas externas atualizadas com sucesso!"
        );
        router.replace(routeToMobilePath(routes.inventory.externalWithdrawals.root) as any);
      }
    } catch (error: any) {
      console.error("Error during batch update:", error);
      // API client already shows error alert
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

  // Loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <ThemedText style={styles.title}>Carregando Retiradas Externas...</ThemedText>
            <View style={styles.skeletonContainer}>
              <SkeletonCard style={styles.skeleton} />
              <SkeletonCard style={styles.skeleton} />
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // No IDs provided
  if (externalWithdrawalIds.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={styles.errorTitle}>Nenhuma Retirada Externa Selecionada</ThemedText>
              <ThemedText style={styles.errorDescription}>
                Nenhuma retirada externa foi selecionada para edição em lote.
              </ThemedText>
              <Button onPress={handleCancel} variant="outline" style={styles.button}>
                <ThemedText>Voltar para Lista</ThemedText>
              </Button>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Error or no valid withdrawals
  if (error || !hasValidWithdrawals) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={styles.errorTitle}>Erro ao Carregar Retiradas Externas</ThemedText>
              <ThemedText style={styles.errorDescription}>
                {error
                  ? "Ocorreu um erro ao carregar as retiradas externas selecionadas."
                  : "As retiradas externas selecionadas não foram encontradas."}
              </ThemedText>
              {!allWithdrawalsFound && externalWithdrawals.length > 0 && (
                <Card
                  style={[
                    styles.warningCard,
                    { backgroundColor: colors.warning + "20", borderColor: colors.warning },
                  ]}
                >
                  <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                    Apenas {externalWithdrawals.length} de {externalWithdrawalIds.length} retiradas externas foram encontradas. As
                    retiradas não encontradas podem ter sido excluídas.
                  </ThemedText>
                </Card>
              )}
              <Button onPress={handleCancel} variant="outline" style={styles.button}>
                <ThemedText>Voltar para Lista</ThemedText>
              </Button>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Get status options
  const statusOptions = [
    { value: EXTERNAL_WITHDRAWAL_STATUS.PENDING, label: EXTERNAL_WITHDRAWAL_STATUS_LABELS[EXTERNAL_WITHDRAWAL_STATUS.PENDING] },
    { value: EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED, label: EXTERNAL_WITHDRAWAL_STATUS_LABELS[EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED] },
    { value: EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED, label: EXTERNAL_WITHDRAWAL_STATUS_LABELS[EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED] },
    { value: EXTERNAL_WITHDRAWAL_STATUS.CHARGED, label: EXTERNAL_WITHDRAWAL_STATUS_LABELS[EXTERNAL_WITHDRAWAL_STATUS.CHARGED] },
    { value: EXTERNAL_WITHDRAWAL_STATUS.CANCELLED, label: EXTERNAL_WITHDRAWAL_STATUS_LABELS[EXTERNAL_WITHDRAWAL_STATUS.CANCELLED] },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Info */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.pulseContainer}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>
                Editando {externalWithdrawals.length} {externalWithdrawals.length === 1 ? "retirada externa" : "retiradas externas"}
              </ThemedText>
              <ThemedText style={[styles.headerDescription, { color: colors.mutedForeground }]}>
                As alterações serão aplicadas a todas as retiradas externas listadas abaixo
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Withdrawal Items */}
        {externalWithdrawals.map((withdrawal, index) => {
          const watchedWithdrawal = watchedWithdrawals[index];
          const currentStatus = watchedWithdrawal?.data.status || withdrawal.status;
          const itemCount = (withdrawal as any)._count?.items || withdrawal.items?.length || 0;

          return (
            <Card key={withdrawal.id} style={styles.withdrawalCard}>
              {/* Withdrawal Info */}
              <View style={styles.itemInfoContainer}>
                <ThemedText style={styles.itemName}>
                  {withdrawal.withdrawerName}
                </ThemedText>
                <ThemedText style={[styles.itemUser, { color: colors.mutedForeground }]}>
                  Itens: {itemCount} | Tipo: {withdrawal.type === "RETURNABLE" ? "Retornável" : withdrawal.type === "CHARGEABLE" ? "Cobrável" : "Cortesia"}
                </ThemedText>
              </View>

              {/* Status Selector */}
              <View style={styles.fieldContainer}>
                <Label>
                  Status <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`externalWithdrawals.${index}.data.status`}
                  render={({ field: { value } }) => (
                    <View>
                      <Combobox
                        value={value}
                        onValueChange={(newValue) => {
                          if (newValue) {
                            handleStatusChange(index, newValue as string);
                          }
                        }}
                        options={statusOptions}
                        placeholder="Selecione o status"
                        searchable={false}
                        clearable={false}
                        error={errors.externalWithdrawals?.[index]?.data?.status?.message}
                      />
                      {errors.externalWithdrawals?.[index]?.data?.status && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          {errors.externalWithdrawals[index]?.data?.status?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Notes Field */}
              <View style={styles.fieldContainer}>
                <Label>Observações</Label>
                <Controller
                  control={control}
                  name={`externalWithdrawals.${index}.data.notes`}
                  render={({ field: { value } }) => (
                    <View>
                      <ThemedText style={styles.notesInput}>
                        {value || "Sem observações"}
                      </ThemedText>
                    </View>
                  )}
                />
              </View>

              {/* Status Warnings */}
              {currentStatus === EXTERNAL_WITHDRAWAL_STATUS.CANCELLED && (
                <Card
                  style={[
                    styles.statusWarningCard,
                    { backgroundColor: colors.destructive + "10", borderColor: colors.destructive },
                  ]}
                >
                  <View style={styles.statusWarningContent}>
                    <IconAlertTriangle size={20} color={colors.destructive} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.destructive }]}>
                        Atenção: Retirada será cancelada
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.destructive }]}>
                        Esta ação cancelará a retirada externa e poderá afetar o estoque.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}

              {currentStatus === EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED && withdrawal.status !== EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED && (
                <Card
                  style={[
                    styles.statusWarningCard,
                    { backgroundColor: colors.success + "10", borderColor: colors.success },
                  ]}
                >
                  <View style={styles.statusWarningContent}>
                    <IconCheck size={20} color={colors.success} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.success }]}>
                        Retirada será marcada como totalmente devolvida
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.success }]}>
                        Todos os itens desta retirada serão considerados devolvidos ao estoque.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}

              {currentStatus === EXTERNAL_WITHDRAWAL_STATUS.CHARGED && withdrawal.status !== EXTERNAL_WITHDRAWAL_STATUS.CHARGED && (
                <Card
                  style={[
                    styles.statusWarningCard,
                    { backgroundColor: colors.primary + "10", borderColor: colors.primary },
                  ]}
                >
                  <View style={styles.statusWarningContent}>
                    <IconCheck size={20} color={colors.primary} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.primary }]}>
                        Retirada será marcada como cobrada
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.primary }]}>
                        Esta retirada será registrada como cobrada e processada financeiramente.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}
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
            <ThemedText>Cancelar</ThemedText>
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={[styles.button, styles.submitButton]}
            disabled={isSubmitting || !isDirty}
          >
            <ThemedText style={{ color: "#fff" }}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </ThemedText>
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },
  skeletonContainer: {
    gap: spacing.lg,
  },
  skeleton: {
    height: 150,
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  warningCard: {
    padding: spacing.md,
    borderWidth: 1,
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
    fontWeight: "600",
  },
  headerDescription: {
    fontSize: fontSize.xs,
  },
  withdrawalCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  itemInfoContainer: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  itemUser: {
    fontSize: fontSize.sm,
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  notesInput: {
    fontSize: fontSize.sm,
    padding: spacing.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 6,
    minHeight: 44,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statusWarningCard: {
    padding: spacing.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  statusWarningContent: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  statusWarningTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  statusWarningTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  statusWarningText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    minWidth: 100,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
