import { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  IconCheck,
  IconArrowDown,
  IconSearch,
  IconX,
} from "@tabler/icons-react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { MultiStepFormContainer } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useCopyFromTask } from "@/hooks/useTask";
import { useTasks } from "@/hooks";
import { getTaskById } from "@/api-client";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Task } from "@/types";
import type { FormStep } from "@/components/ui/form-steps";
import {
  COPYABLE_FIELD_METADATA,
  type CopyableTaskField,
  getFieldsUserCanCopy,
} from "@/types/task-copy";

const WIZARD_STEPS: FormStep[] = [
  { id: 1, name: "Campos", description: "Selecionar campos" },
  { id: 2, name: "Origem", description: "Tarefa de origem" },
  { id: 3, name: "Confirmar", description: "Revisar e copiar" },
];

const CATEGORY_ORDER = [
  "Ações Rápidas",
  "Informações Gerais",
  "Datas",
  "Comercial",
  "Pintura",
  "Arquivos",
  "Produção",
  "Ordens de Serviço",
  "Veículo",
];

interface CopyFromTaskWizardProps {
  taskId: string;
}

// ============================================================================
// Field Selection Item
// ============================================================================

function FieldSelectionItem({
  field,
  isSelected,
  onToggle,
}: {
  field: CopyableTaskField;
  isSelected: boolean;
  onToggle: (field: CopyableTaskField) => void;
}) {
  const { colors } = useTheme();
  const metadata = COPYABLE_FIELD_METADATA[field];

  return (
    <TouchableOpacity
      style={[
        styles.fieldItem,
        {
          backgroundColor: isSelected ? colors.primary + "10" : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={() => onToggle(field)}
      activeOpacity={0.7}
    >
      <View style={styles.fieldItemLeft}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected ? colors.primary : "transparent",
              borderColor: isSelected ? colors.primary : colors.border,
            },
          ]}
        >
          {isSelected && <IconCheck size={12} color="#fff" />}
        </View>
        <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
          {metadata.label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Task Mini Display (for confirmation step)
// ============================================================================

function TaskMiniDisplay({
  task,
  title,
  variant,
  onChangeSource,
}: {
  task: Task;
  title: string;
  variant: "source" | "destination";
  onChangeSource?: () => void;
}) {
  const { colors } = useTheme();

  const bgColor = variant === "source" ? "#22c55e10" : "#3b82f610";
  const borderColor = variant === "source" ? "#22c55e40" : "#3b82f640";
  const headerColor = variant === "source" ? "#22c55e" : "#3b82f6";

  return (
    <View style={[styles.taskDisplay, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.taskDisplayHeader, { borderBottomColor: borderColor }]}>
        <ThemedText style={[styles.taskDisplayTitle, { color: headerColor }]}>
          {title}
        </ThemedText>
        {onChangeSource && (
          <TouchableOpacity onPress={onChangeSource}>
            <ThemedText style={[styles.changeButton, { color: headerColor }]}>
              Alterar
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.taskDisplayContent}>
        <View style={styles.taskDisplayRow}>
          <ThemedText style={[styles.taskDisplayLabel, { color: colors.mutedForeground }]}>
            Nome:
          </ThemedText>
          <ThemedText style={[styles.taskDisplayValue, { color: colors.foreground }]} numberOfLines={1}>
            {task.name || "-"}
          </ThemedText>
        </View>
        <View style={styles.taskDisplayRow}>
          <ThemedText style={[styles.taskDisplayLabel, { color: colors.mutedForeground }]}>
            Nº Série:
          </ThemedText>
          <ThemedText style={[styles.taskDisplayValue, { color: colors.foreground }]}>
            {task.serialNumber || (task as any)?.truck?.plate || "-"}
          </ThemedText>
        </View>
        <View style={styles.taskDisplayRow}>
          <ThemedText style={[styles.taskDisplayLabel, { color: colors.mutedForeground }]}>
            Setor:
          </ThemedText>
          <ThemedText style={[styles.taskDisplayValue, { color: colors.foreground }]}>
            {(task as any)?.sector?.name || "-"}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Source Task Table
// ============================================================================

function SourceTaskTable({
  tasks,
  selectedTaskId,
  onSelect,
  isLoading,
  searchQuery,
  onSearchChange,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (task: Task) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.tableContainer}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <IconSearch size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar tarefa..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <IconX size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Table Header */}
      <View style={[styles.tableHeader, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <ThemedText style={[styles.tableHeaderCell, styles.tableNameCol, { color: colors.mutedForeground }]}>
          Nome
        </ThemedText>
        <ThemedText style={[styles.tableHeaderCell, styles.tableSerialCol, { color: colors.mutedForeground }]}>
          Nº Série
        </ThemedText>
        <ThemedText style={[styles.tableHeaderCell, styles.tableSectorCol, { color: colors.mutedForeground }]}>
          Setor
        </ThemedText>
      </View>

      {/* Table Body */}
      <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.tableEmptyState}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={[styles.tableEmptyText, { color: colors.mutedForeground }]}>
              Carregando tarefas...
            </ThemedText>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.tableEmptyState}>
            <ThemedText style={[styles.tableEmptyText, { color: colors.mutedForeground }]}>
              Nenhuma tarefa encontrada
            </ThemedText>
          </View>
        ) : (
          tasks.map((task, index) => {
            const isSelected = task.id === selectedTaskId;
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "15"
                      : index % 2 === 0
                      ? colors.background
                      : colors.muted + "50",
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 1.5 : 0,
                    borderBottomWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
                    borderBottomColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onSelect(task)}
                activeOpacity={0.7}
              >
                <View style={[styles.tableCell, styles.tableNameCol]}>
                  <ThemedText
                    style={[
                      styles.tableCellText,
                      { color: colors.foreground },
                      isSelected && { fontWeight: fontWeight.semibold },
                    ]}
                    numberOfLines={1}
                  >
                    {task.name || "Sem nome"}
                  </ThemedText>
                </View>
                <View style={[styles.tableCell, styles.tableSerialCol]}>
                  <ThemedText
                    style={[styles.tableCellText, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {task.serialNumber || (task as any)?.truck?.plate || "-"}
                  </ThemedText>
                </View>
                <View style={[styles.tableCell, styles.tableSectorCol]}>
                  <ThemedText
                    style={[styles.tableCellText, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {(task as any)?.sector?.name || "-"}
                  </ThemedText>
                </View>
                {isSelected && (
                  <View style={[styles.tableSelectedBadge, { backgroundColor: colors.primary }]}>
                    <IconCheck size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Main Wizard Component
// ============================================================================

export function CopyFromTaskWizard({ taskId }: CopyFromTaskWizardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFields, setSelectedFields] = useState<Set<CopyableTaskField>>(new Set());
  const [sourceTask, setSourceTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefetchingSource, setIsRefetchingSource] = useState(false);

  // Fetch target task data
  const { data: taskResponse, isLoading: taskLoading } = useTaskDetail(taskId, {
    include: {
      sector: { select: { id: true, name: true } },
      truck: { select: { id: true, plate: true } },
    },
  });
  const targetTask = taskResponse?.data;

  // Fetch tasks for source selection
  const { data: tasksResponse, isLoading: isLoadingTasks } = useTasks({
    limit: 50,
    orderBy: { createdAt: "desc" },
    include: {
      sector: true,
      truck: true,
    },
    enabled: currentStep === 2,
  });

  // Copy mutation
  const copyMutation = useCopyFromTask();

  // Get fields the user is allowed to copy
  const userPrivilege = user?.sector?.privileges;
  const allowedFields = useMemo(
    () => getFieldsUserCanCopy(userPrivilege),
    [userPrivilege]
  );

  // Individual fields (excluding 'all' meta-option)
  const individualFields = useMemo(
    () => allowedFields.filter((f) => f !== "all"),
    [allowedFields]
  );

  // Computed: are all individual fields selected?
  const allIndividualSelected = individualFields.length > 0 &&
    individualFields.every((f) => selectedFields.has(f));

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const groups: Record<string, CopyableTaskField[]> = {};
    allowedFields.forEach((field) => {
      const metadata = COPYABLE_FIELD_METADATA[field];
      if (!groups[metadata.category]) {
        groups[metadata.category] = [];
      }
      groups[metadata.category].push(field);
    });
    return groups;
  }, [allowedFields]);

  // Filter tasks for source selection (exclude target task)
  const filteredTasks = useMemo(() => {
    const tasks = tasksResponse?.data || [];
    const filtered = tasks.filter((t: Task) => t.id !== taskId);

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter((t: Task) =>
      (t.name?.toLowerCase().includes(query)) ||
      (t.serialNumber?.toLowerCase().includes(query)) ||
      ((t as any).truck?.plate?.toLowerCase().includes(query))
    );
  }, [tasksResponse?.data, taskId, searchQuery]);

  // Toggle field selection (matching web behavior: 'all' is never stored,
  // it selects/deselects all individual fields instead)
  const handleToggleField = useCallback((field: CopyableTaskField) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (field === "all") {
        if (allIndividualSelected) {
          newSet.clear();
        } else {
          individualFields.forEach((f) => newSet.add(f));
        }
      } else {
        if (newSet.has(field)) {
          newSet.delete(field);
        } else {
          newSet.add(field);
        }
      }
      return newSet;
    });
  }, [allIndividualSelected, individualFields]);

  // Refetch source task with full includes (matching web's critical fix)
  const handleSourceTaskSelected = useCallback(async (task: Task) => {
    setIsRefetchingSource(true);
    try {
      const fullSourceTask = await getTaskById(task.id, {
        include: {
          artworks: { include: { file: true } },
          budgets: true,
          invoices: true,
          receipts: true,
          quote: true,
          logoPaints: true,
          cuts: true,
          serviceOrders: true,
          sector: true,
          truck: {
            include: {
              leftSideLayout: { include: { layoutSections: true, photo: true } },
              rightSideLayout: { include: { layoutSections: true, photo: true } },
              backSideLayout: { include: { layoutSections: true, photo: true } },
            },
          },
        },
      });

      if (!fullSourceTask.success || !fullSourceTask.data) {
        throw new Error('Failed to fetch source task details');
      }

      setSourceTask(fullSourceTask.data);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar detalhes da tarefa de origem");
      setSourceTask(null);
    } finally {
      setIsRefetchingSource(false);
    }
  }, []);

  // Step navigation
  const canProceed = useMemo(() => {
    if (currentStep === 1) return selectedFields.size > 0;
    if (currentStep === 2) return !!sourceTask;
    return false;
  }, [currentStep, selectedFields.size, sourceTask]);

  const goNext = useCallback(() => {
    if (currentStep === 1 && selectedFields.size === 0) {
      Alert.alert("Selecione campos", "Selecione pelo menos um campo para copiar.");
      return false;
    }
    if (currentStep === 2 && !sourceTask) {
      Alert.alert("Selecione tarefa", "Selecione a tarefa de origem.");
      return false;
    }
    if (currentStep < 3) setCurrentStep((s) => s + 1);
  }, [currentStep, selectedFields.size, sourceTask]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleConfirm = useCallback(async () => {
    if (!sourceTask || selectedFields.size === 0) return;

    // Fields are already individual (no 'all' in Set), submit directly
    const fieldsToSubmit = Array.from(selectedFields);

    try {
      await copyMutation.mutateAsync({
        destinationTaskId: taskId,
        data: {
          sourceTaskId: sourceTask.id,
          fields: fieldsToSubmit,
        },
      });

      Alert.alert(
        "Campos copiados com sucesso",
        `${fieldsToSubmit.length} campo(s) copiado(s) de "${sourceTask.name}"`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Erro ao copiar campos",
        error.message || "Não foi possível copiar os campos. Tente novamente.",
      );
    }
  }, [sourceTask, selectedFields, copyMutation, taskId, router]);

  // Loading state
  if (taskLoading || !targetTask) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando tarefa...
        </ThemedText>
      </View>
    );
  }

  return (
    <MultiStepFormContainer
      steps={WIZARD_STEPS}
      currentStep={currentStep}
      onPrevStep={goPrev}
      onNextStep={goNext}
      onSubmit={handleConfirm}
      onCancel={handleCancel}
      isSubmitting={copyMutation.isPending}
      canProceed={canProceed}
      canSubmit={!!sourceTask && selectedFields.size > 0}
      submitLabel="Copiar"
      cancelLabel="Cancelar"
      scrollable={currentStep !== 2}
    >
      {/* Step 1 - Select Fields */}
      {currentStep === 1 && (
        <View style={styles.stepContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Tarefa de Destino</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskMiniDisplay
                task={targetTask}
                title="Tarefa de Destino"
                variant="destination"
              />
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Campos para Copiar</CardTitle>
            </CardHeader>
            <CardContent>
              {CATEGORY_ORDER.map((category) => {
                const fields = fieldsByCategory[category];
                if (!fields || fields.length === 0) return null;

                return (
                  <View key={category} style={styles.categorySection}>
                    <ThemedText style={[styles.categoryTitle, { color: colors.mutedForeground }]}>
                      {category}
                    </ThemedText>
                    <View style={styles.fieldsList}>
                      {fields.map((field) => (
                        <FieldSelectionItem
                          key={field}
                          field={field}
                          isSelected={field === "all" ? allIndividualSelected : selectedFields.has(field)}
                          onToggle={handleToggleField}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}

              {selectedFields.size > 0 && (
                <View style={[styles.selectionCounter, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <ThemedText style={[styles.selectionCounterText, { color: colors.foreground }]}>
                    {allIndividualSelected
                      ? "Todos os campos selecionados"
                      : `${selectedFields.size} campo${selectedFields.size > 1 ? "s" : ""} selecionado${selectedFields.size > 1 ? "s" : ""}`}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setSelectedFields(new Set())}>
                    <ThemedText style={[styles.clearButton, { color: colors.primary }]}>Limpar</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* Step 2 - Select Source Task */}
      {currentStep === 2 && (
        <View style={styles.stepContainerFull}>
          <Card style={styles.cardFull}>
            <CardHeader>
              <CardTitle>Selecionar Tarefa de Origem</CardTitle>
            </CardHeader>
            <CardContent style={styles.tableCardContent}>
              <SourceTaskTable
                tasks={filteredTasks}
                selectedTaskId={sourceTask?.id || null}
                onSelect={handleSourceTaskSelected}
                isLoading={isLoadingTasks || isRefetchingSource}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </CardContent>
          </Card>
        </View>
      )}

      {/* Step 3 - Confirm */}
      {currentStep === 3 && (
        <View style={styles.stepContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Revisar Cópia</CardTitle>
            </CardHeader>
            <CardContent>
              {sourceTask && (
                <TaskMiniDisplay
                  task={sourceTask}
                  title="Tarefa de Origem"
                  variant="source"
                  onChangeSource={() => setCurrentStep(2)}
                />
              )}

              <View style={styles.arrowContainer}>
                <View style={[styles.arrowCircle, { backgroundColor: colors.primary + "10" }]}>
                  <IconArrowDown size={16} color={colors.primary} />
                </View>
              </View>

              <TaskMiniDisplay
                task={targetTask}
                title="Tarefa de Destino"
                variant="destination"
              />
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Campos que serão copiados</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.confirmFieldsList}>
                {allIndividualSelected ? (
                  <View style={[styles.confirmFieldItem, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                    <IconCheck size={16} color={colors.primary} />
                    <ThemedText style={[styles.confirmFieldText, { color: colors.foreground }]}>
                      COPIAR TUDO
                    </ThemedText>
                  </View>
                ) : (
                  Array.from(selectedFields).map((field) => {
                    const metadata = COPYABLE_FIELD_METADATA[field];
                    return (
                      <View
                        key={field}
                        style={[styles.confirmFieldItem, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      >
                        <IconCheck size={14} color="#22c55e" />
                        <ThemedText style={[styles.confirmFieldText, { color: colors.foreground }]}>
                          {metadata.label}
                        </ThemedText>
                      </View>
                    );
                  })
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      )}
    </MultiStepFormContainer>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  stepContainer: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  stepContainerFull: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  card: {
    marginBottom: 0,
  },
  cardFull: {
    flex: 1,
    marginBottom: 0,
  },
  tableCardContent: {
    flex: 1,
    paddingHorizontal: 0,
  },

  // Field selection
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  fieldsList: {
    gap: spacing.xs,
  },
  fieldItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  fieldItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  selectionCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  selectionCounterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  clearButton: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Task display (confirmation)
  taskDisplay: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskDisplayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  taskDisplayTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  changeButton: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  taskDisplayContent: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  taskDisplayRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  taskDisplayLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    width: 70,
  },
  taskDisplayValue: {
    fontSize: fontSize.xs,
    flex: 1,
  },

  // Arrow
  arrowContainer: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Confirm fields
  confirmFieldsList: {
    gap: spacing.xs,
  },
  confirmFieldItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  confirmFieldText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },

  // Source task table
  tableContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xs,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  tableHeaderCell: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  tableCell: {
    justifyContent: "center",
  },
  tableCellText: {
    fontSize: fontSize.sm,
  },
  tableNameCol: {
    flex: 2,
    paddingRight: spacing.sm,
  },
  tableSerialCol: {
    flex: 1,
  },
  tableSectorCol: {
    flex: 1,
    paddingLeft: spacing.xs,
  },
  tableSelectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  tableEmptyState: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  tableEmptyText: {
    fontSize: fontSize.sm,
  },
});
