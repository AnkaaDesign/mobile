import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
  IconCheck,
  IconClipboardCopy,
  IconArrowDown,
  IconInfoCircle,
  IconCopy,
  IconX,
  IconSearch,
} from "@tabler/icons-react-native";
import type { Task } from "@/types";
import {
  COPYABLE_FIELD_METADATA,
  type CopyableTaskField,
  getFieldsUserCanCopy,
  expandAllFieldsForUser,
} from "@/types/task-copy";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useTasks, useCopyFromTask } from "@/hooks";
import { Alert } from "react-native";

export interface CopyFromTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTask: Task;
  userPrivilege?: string;
  onSuccess?: () => void;
}

type ModalStep = "selecting_fields" | "selecting_source" | "confirming";

// Compact task display component
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
            Serie/Placa:
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
            {task.sector?.name || "-"}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// Field selection item component
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
      <View style={styles.fieldItemRight}>
        {metadata.isShared && (
          <View style={[styles.badge, { backgroundColor: "#3b82f610", borderColor: "#3b82f640" }]}>
            <IconInfoCircle size={10} color="#3b82f6" />
            <ThemedText style={[styles.badgeText, { color: "#3b82f6" }]}>Compart.</ThemedText>
          </View>
        )}
        {metadata.createNewInstances && (
          <View style={[styles.badge, { backgroundColor: "#22c55e10", borderColor: "#22c55e40" }]}>
            <IconCopy size={10} color="#22c55e" />
            <ThemedText style={[styles.badgeText, { color: "#22c55e" }]}>Nova</ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Task list item for source selection
function TaskListItem({
  task,
  isSelected,
  onSelect,
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.taskListItem,
        {
          backgroundColor: isSelected ? colors.primary + "15" : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.taskListItemContent}>
        <ThemedText style={[styles.taskListItemName, { color: colors.foreground }]} numberOfLines={1}>
          {task.name || "Sem nome"}
        </ThemedText>
        <ThemedText style={[styles.taskListItemSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {task.serialNumber || (task as any)?.truck?.plate || "-"} | {task.sector?.name || "-"}
        </ThemedText>
      </View>
      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
          <IconCheck size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export function CopyFromTaskModal({
  open,
  onOpenChange,
  targetTask,
  userPrivilege,
  onSuccess,
}: CopyFromTaskModalProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<ModalStep>("selecting_fields");
  const [selectedFields, setSelectedFields] = useState<Set<CopyableTaskField>>(new Set());
  const [sourceTask, setSourceTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tasks for source selection
  const { data: tasksResponse, isLoading: isLoadingTasks } = useTasks({
    limit: 50,
    orderBy: { createdAt: "desc" },
    include: {
      sector: true,
      truck: true,
    },
    enabled: open && step === "selecting_source",
  });

  // Copy mutation
  const copyMutation = useCopyFromTask();

  // Get fields the user is allowed to copy
  const allowedFields = useMemo(
    () => getFieldsUserCanCopy(userPrivilege),
    [userPrivilege]
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("selecting_fields");
      setSelectedFields(new Set());
      setSourceTask(null);
      setSearchQuery("");
    }
  }, [open]);

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
    const filtered = tasks.filter((t: Task) => t.id !== targetTask.id);

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter((t: Task) =>
      (t.name?.toLowerCase().includes(query)) ||
      (t.serialNumber?.toLowerCase().includes(query)) ||
      ((t as any).truck?.plate?.toLowerCase().includes(query)) ||
      (t.sector?.name?.toLowerCase().includes(query))
    );
  }, [tasksResponse?.data, targetTask.id, searchQuery]);

  const categoryOrder = [
    "Acoes Rapidas",
    "Informacoes Gerais",
    "Datas",
    "Comercial",
    "Pintura e Artes",
    "Producao",
    "Veiculo",
  ];

  const handleToggleField = useCallback((field: CopyableTaskField) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);

      if (field === "all") {
        if (newSet.has("all")) {
          newSet.delete("all");
        } else {
          newSet.clear();
          newSet.add("all");
        }
      } else {
        if (newSet.has("all")) {
          newSet.delete("all");
        }

        if (newSet.has(field)) {
          newSet.delete(field);
        } else {
          newSet.add(field);
        }
      }

      return newSet;
    });
  }, []);

  const handleNextStep = useCallback(() => {
    if (step === "selecting_fields" && selectedFields.size > 0) {
      setStep("selecting_source");
    } else if (step === "selecting_source" && sourceTask) {
      setStep("confirming");
    }
  }, [step, selectedFields.size, sourceTask]);

  const handleBack = useCallback(() => {
    if (step === "selecting_source") {
      setStep("selecting_fields");
    } else if (step === "confirming") {
      setStep("selecting_source");
    }
  }, [step]);

  const handleConfirm = useCallback(async () => {
    if (!sourceTask || selectedFields.size === 0) return;

    const fieldsToSubmit = expandAllFieldsForUser(Array.from(selectedFields), userPrivilege);

    try {
      await copyMutation.mutateAsync({
        destinationTaskId: targetTask.id,
        data: {
          sourceTaskId: sourceTask.id,
          fields: fieldsToSubmit,
        },
      });

      Alert.alert("Sucesso", "Campos copiados com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao copiar campos");
    }
  }, [sourceTask, selectedFields, userPrivilege, copyMutation, targetTask.id, onOpenChange, onSuccess]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const renderStepContent = () => {
    if (step === "selecting_fields") {
      return (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TaskMiniDisplay
            task={targetTask}
            title="Tarefa de Destino"
            variant="destination"
          />

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
            Campos para copiar
          </ThemedText>

          {categoryOrder.map((category) => {
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
                      isSelected={selectedFields.has(field)}
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
                {selectedFields.has("all")
                  ? "Todos os campos"
                  : `${selectedFields.size} campo${selectedFields.size > 1 ? "s" : ""}`}
              </ThemedText>
              <TouchableOpacity onPress={() => setSelectedFields(new Set())}>
                <ThemedText style={[styles.clearButton, { color: colors.primary }]}>Limpar</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      );
    }

    if (step === "selecting_source") {
      return (
        <View style={styles.scrollContent}>
          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <IconSearch size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar tarefa..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconX size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Task list */}
          <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
            {isLoadingTasks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Carregando tarefas...
                </ThemedText>
              </View>
            ) : filteredTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Nenhuma tarefa encontrada
                </ThemedText>
              </View>
            ) : (
              filteredTasks.map((task: Task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isSelected={sourceTask?.id === task.id}
                  onSelect={() => setSourceTask(task)}
                />
              ))
            )}
          </ScrollView>
        </View>
      );
    }

    // Confirming step
    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sourceTask && (
          <TaskMiniDisplay
            task={sourceTask}
            title="Tarefa de Origem"
            variant="source"
            onChangeSource={() => setStep("selecting_source")}
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

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
          Campos que serao copiados:
        </ThemedText>

        <View style={styles.confirmFieldsList}>
          {selectedFields.has("all") ? (
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
      </ScrollView>
    );
  };

  const getStepTitle = () => {
    switch (step) {
      case "selecting_fields":
        return "Selecionar Campos";
      case "selecting_source":
        return "Selecionar Tarefa de Origem";
      case "confirming":
        return "Confirmar Copia";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "selecting_fields":
        return "Selecione os campos que deseja copiar de outra tarefa.";
      case "selecting_source":
        return "Selecione a tarefa de onde os campos serao copiados.";
      case "confirming":
        return "Revise e confirme os campos que serao copiados.";
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClipboardCopy size={20} color={colors.foreground} />
              <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
                {getStepTitle()}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleCancel}>
              <IconX size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            {getStepDescription()}
          </ThemedText>

          {/* Content */}
          {renderStepContent()}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {step !== "selecting_fields" && (
              <Button variant="outline" size="sm" onPress={handleBack} style={styles.footerButton}>
                <ThemedText style={{ color: colors.foreground }}>Voltar</ThemedText>
              </Button>
            )}
            {step === "selecting_fields" && (
              <Button variant="outline" size="sm" onPress={handleCancel} style={styles.footerButton}>
                <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
              </Button>
            )}

            {step === "selecting_fields" && (
              <Button
                variant="default"
                size="sm"
                onPress={handleNextStep}
                disabled={selectedFields.size === 0}
                style={styles.footerButton}
              >
                <ThemedText style={{ color: "#fff" }}>Proximo</ThemedText>
                <IconArrowRight size={16} color="#fff" style={{ marginLeft: 4 }} />
              </Button>
            )}

            {step === "selecting_source" && (
              <Button
                variant="default"
                size="sm"
                onPress={handleNextStep}
                disabled={!sourceTask}
                style={styles.footerButton}
              >
                <ThemedText style={{ color: "#fff" }}>Proximo</ThemedText>
                <IconArrowRight size={16} color="#fff" style={{ marginLeft: 4 }} />
              </Button>
            )}

            {step === "confirming" && (
              <Button
                variant="default"
                size="sm"
                onPress={handleConfirm}
                disabled={copyMutation.isPending}
                style={styles.footerButton}
              >
                {copyMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconClipboardCopy size={16} color="#fff" style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: "#fff" }}>Copiar</ThemedText>
                  </>
                )}
              </Button>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    minHeight: 500,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  scrollContent: {
    flex: 1,
    minHeight: 320,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
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
  separator: {
    height: 1,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
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
  fieldItemRight: {
    flexDirection: "row",
    gap: spacing.xs,
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: fontWeight.medium,
  },
  selectionCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  selectionCounterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  clearButton: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
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
  confirmFieldsList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
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
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    minWidth: 100,
  },
  // Source selection styles
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
  taskList: {
    flex: 1,
  },
  taskListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  taskListItemContent: {
    flex: 1,
  },
  taskListItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  taskListItemSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});

export default CopyFromTaskModal;
