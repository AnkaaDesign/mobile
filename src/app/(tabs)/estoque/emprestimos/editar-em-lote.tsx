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
import { NumberInput } from "@/components/ui/number-input";
import { Combobox } from "@/components/ui/combobox";
import { SkeletonCard } from "@/components/ui/loading";
import { showToast } from "@/components/ui/toast";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useBorrows, useBorrowBatchMutations } from "@/hooks";
import { routeToMobilePath } from "@/utils/route-mapper";
import { routes, SECTOR_PRIVILEGES, BORROW_STATUS, BORROW_STATUS_LABELS, BORROW_STATUS_ORDER } from "@/constants";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react-native";

// Schema for batch edit form
const borrowBatchEditSchema = z.object({
  borrows: z.array(
    z.object({
      id: z.string(),
      data: z.object({
        quantity: z.number().positive().min(0.01, "Quantidade deve ser maior que 0"),
        status: z.enum([BORROW_STATUS.ACTIVE, BORROW_STATUS.RETURNED, BORROW_STATUS.LOST] as const),
        statusOrder: z.number().int().positive().optional(),
        returnedAt: z.date().nullable().optional(),
      }),
    }),
  ),
});

type BorrowBatchEditFormData = z.infer<typeof borrowBatchEditSchema>;

export default function BatchEditLoansScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <BatchEditLoansScreen />
    </PrivilegeGuard>
  );
}

function BatchEditLoansScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ ids: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { batchUpdateAsync } = useBorrowBatchMutations();

  // Parse borrow IDs from URL params
  const borrowIds = useMemo(() => {
    if (!params.ids) return [];
    return params.ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch borrows to edit
  const {
    data: response,
    isLoading,
    error,
  } = useBorrows({
    where: {
      id: { in: borrowIds },
    },
    include: {
      item: {
        include: {
          brand: true,
          category: true,
        },
      },
      user: {
        include: {
          sector: true,
        },
      },
    },
    enabled: borrowIds.length > 0,
  });

  const borrows = response?.data || [];
  const hasValidBorrows = borrows.length > 0;
  const allBorrowsFound = borrows.length === borrowIds.length;

  // Initialize form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<BorrowBatchEditFormData>({
    resolver: zodResolver(borrowBatchEditSchema),
    mode: "onChange",
    defaultValues: {
      borrows: borrows.map((borrow) => ({
        id: borrow.id,
        data: {
          quantity: borrow.quantity,
          status: borrow.status,
          statusOrder: borrow.statusOrder || BORROW_STATUS_ORDER[borrow.status] || 1,
          returnedAt: borrow.returnedAt ? new Date(borrow.returnedAt) : null,
        },
      })),
    },
  });

  // Watch all form values
  const watchedBorrows = watch("borrows");

  // Handle status change with proper date logic
  const handleStatusChange = useCallback(
    (index: number, newStatus: string) => {
      setValue(`borrows.${index}.data.status`, newStatus as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue(`borrows.${index}.data.statusOrder`, BORROW_STATUS_ORDER[newStatus] || 1, {
        shouldDirty: true,
      });

      // Automatically set returnedAt when marking as returned
      if (newStatus === BORROW_STATUS.RETURNED && !watchedBorrows[index]?.data.returnedAt) {
        setValue(`borrows.${index}.data.returnedAt`, new Date(), { shouldDirty: true });
      } else if (newStatus === BORROW_STATUS.ACTIVE || newStatus === BORROW_STATUS.LOST) {
        // ACTIVE and LOST status should have null returnedAt
        setValue(`borrows.${index}.data.returnedAt`, null, { shouldDirty: true });
      }
    },
    [setValue, watchedBorrows]
  );

  // Submit handler
  const onSubmit = async (data: BorrowBatchEditFormData) => {
    setIsSubmitting(true);
    try {
      const updateBorrows = data.borrows.map((borrow) => ({
        id: borrow.id,
        data: {
          ...borrow.data,
          statusOrder: BORROW_STATUS_ORDER[borrow.data.status] || 1,
          // Automatically set returnedAt when marking as returned
          returnedAt:
            borrow.data.status === BORROW_STATUS.RETURNED
              ? borrow.data.returnedAt || new Date()
              : null,
        },
      }));

      const batchPayload = { borrows: updateBorrows };
      const result = await batchUpdateAsync(batchPayload);

      if (result?.data) {
        const { totalSuccess, totalFailed } = result.data;

        if (totalFailed === 0) {
          showToast({
            message: `${totalSuccess} empréstimo(s) atualizado(s) com sucesso!`,
            type: "success",
          });
          router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
        } else {
          showToast({
            message: `${totalSuccess} sucesso(s), ${totalFailed} falha(s)`,
            type: "warning",
          });
        }
      } else {
        showToast({
          message: "Empréstimos atualizados com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
      }
    } catch (error: any) {
      console.error("Error during batch update:", error);
      showToast({
        message: error.message || "Erro ao atualizar empréstimos",
        type: "error",
      });
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
            <View>
              <ThemedText style={styles.title}>Carregando Empréstimos...</ThemedText>
              <View style={styles.skeletonContainer}>
                <SkeletonCard style={styles.skeleton} />
                <SkeletonCard style={styles.skeleton} />
              </View>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // No IDs provided
  if (borrowIds.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={styles.errorTitle}>Nenhum Empréstimo Selecionado</ThemedText>
              <ThemedText style={styles.errorDescription}>
                Nenhum empréstimo foi selecionado para edição em lote.
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

  // Error or no valid borrows
  if (error || !hasValidBorrows) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={styles.errorTitle}>Erro ao Carregar Empréstimos</ThemedText>
              <ThemedText style={styles.errorDescription}>
                {error
                  ? "Ocorreu um erro ao carregar os empréstimos selecionados."
                  : "Os empréstimos selecionados não foram encontrados."}
              </ThemedText>
              {!allBorrowsFound && borrows.length > 0 && (
                <Card
                  style={StyleSheet.flatten([
                    styles.warningCard,
                    { backgroundColor: colors.warning + "20", borderColor: colors.warning },
                  ])}
                >
                  <View>
                    <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                      Apenas {borrows.length} de {borrowIds.length} empréstimos foram encontrados. Os
                      empréstimos não encontrados podem ter sido excluídos.
                    </ThemedText>
                  </View>
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
    { value: BORROW_STATUS.ACTIVE, label: BORROW_STATUS_LABELS[BORROW_STATUS.ACTIVE] },
    { value: BORROW_STATUS.RETURNED, label: BORROW_STATUS_LABELS[BORROW_STATUS.RETURNED] },
    { value: BORROW_STATUS.LOST, label: BORROW_STATUS_LABELS[BORROW_STATUS.LOST] },
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
                Editando {borrows.length} {borrows.length === 1 ? "empréstimo" : "empréstimos"}
              </ThemedText>
              <ThemedText style={[styles.headerDescription, { color: colors.mutedForeground }]}>
                As alterações serão aplicadas a todos os empréstimos listados abaixo
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Borrow Items */}
        {borrows.map((borrow, index) => {
          const watchedBorrow = watchedBorrows[index];
          const currentStatus = watchedBorrow?.data.status || borrow.status;

          return (
            <Card key={borrow.id} style={styles.borrowCard}>
              {/* Item Info */}
              <View style={styles.itemInfoContainer}>
                <ThemedText style={styles.itemName}>
                  {borrow.item?.uniCode
                    ? `${borrow.item.uniCode} - ${borrow.item.name}`
                    : borrow.item?.name || "Item não encontrado"}
                </ThemedText>
                <ThemedText style={[styles.itemUser, { color: colors.mutedForeground }]}>
                  Usuário: {borrow.user?.name || "-"}
                </ThemedText>
              </View>

              {/* Quantity Input */}
              <View style={styles.fieldContainer}>
                <Label>
                  Quantidade <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`borrows.${index}.data.quantity`}
                  render={({ field: { value, onChange } }) => (
                    <View>
                      <NumberInput
                        value={value}
                        onChange={onChange}
                        placeholder="0.00"
                        min={0.01}
                        decimalPlaces={2}
                        allowNegative={false}
                        error={!!errors.borrows?.[index]?.data?.quantity}
                      />
                      {errors.borrows?.[index]?.data?.quantity && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          {errors.borrows[index]?.data?.quantity?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Status Selector */}
              <View style={styles.fieldContainer}>
                <Label>
                  Status <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`borrows.${index}.data.status`}
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
                        error={errors.borrows?.[index]?.data?.status?.message}
                      />
                      {errors.borrows?.[index]?.data?.status && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          {errors.borrows[index]?.data?.status?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Status Warnings */}
              {currentStatus === BORROW_STATUS.LOST && (
                <Card
                  style={StyleSheet.flatten([
                    styles.statusWarningCard,
                    { backgroundColor: colors.destructive + "10", borderColor: colors.destructive },
                  ])}
                >
                  <View style={styles.statusWarningContent}>
                    <IconAlertTriangle size={20} color={colors.destructive} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.destructive }]}>
                        Atenção: Item será marcado como perdido
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.destructive }]}>
                        Esta ação indica que o item foi perdido e pode impactar o estoque.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}

              {currentStatus === BORROW_STATUS.RETURNED && borrow.status !== BORROW_STATUS.RETURNED && (
                <Card
                  style={StyleSheet.flatten([
                    styles.statusWarningCard,
                    { backgroundColor: colors.success + "10", borderColor: colors.success },
                  ])}
                >
                  <View style={styles.statusWarningContent}>
                    <IconCheck size={20} color={colors.success} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.success }]}>
                        Item será marcado como devolvido
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.success }]}>
                        O item será retornado ao estoque e a data de devolução será registrada.
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
            style={StyleSheet.flatten([styles.button, styles.cancelButton])}
            disabled={isSubmitting}
          >
            <ThemedText>Cancelar</ThemedText>
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={StyleSheet.flatten([styles.button, styles.submitButton])}
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
  borrowCard: {
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
