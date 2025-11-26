import { useState, useMemo } from "react";
import { View, ScrollView, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES, TASK_STATUS } from "@/constants/enums";
import { useTasksInfiniteMobile, useTaskBatchMutations, useSectors } from "@/hooks";
import { showToast } from "@/components/ui/toast";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/utils/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import Icon from "@/components/ui/icon";

/**
 * Batch Operations Screen
 *
 * Allows bulk operations on production tasks:
 * - Multi-select from schedule list
 * - Bulk status updates
 * - Sector reassignment
 * - Date modifications (term/entry date)
 * - Validation and confirmation
 */
export default function BatchOperationsScreen() {
  const { colors } = useTheme();
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [operationType, setOperationType] = useState<"status" | "sector" | "date" | null>(null);
  const [newStatus, setNewStatus] = useState<TASK_STATUS | "">("");
  const [newSectorId, setNewSectorId] = useState<string>("");
  const [dateField, setDateField] = useState<"entryDate" | "term">("term");
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch tasks with pagination
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasksInfiniteMobile({
    include: {
      customer: true,
      sector: true,
      truck: true,
    },
    limit: 25,
  });

  // Fetch sectors for reassignment
  const { data: sectorsResponse } = useSectors({
    limit: 100,
  });
  const sectors = sectorsResponse?.data || [];

  // Batch mutations
  const { batchUpdateAsync, isLoading: isUpdating } = useTaskBatchMutations();

  // Toggle task selection
  const toggleTask = (taskId: string) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTaskIds(newSelection);
  };

  // Select all tasks on current page
  const selectAll = () => {
    const allTaskIds = new Set(tasks.map(t => t.id));
    setSelectedTaskIds(allTaskIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  // Prepare batch update data
  const prepareBatchUpdate = () => {
    if (selectedTaskIds.size === 0) {
      showToast({
        title: "Nenhuma tarefa selecionada",
        message: "Selecione pelo menos uma tarefa para atualizar",
        type: "error",
      });
      return null;
    }

    const updates = Array.from(selectedTaskIds).map(id => {
      const updateData: any = {};

      if (operationType === "status" && newStatus) {
        updateData.status = newStatus;
      } else if (operationType === "sector" && newSectorId) {
        updateData.sectorId = newSectorId;
      } else if (operationType === "date" && newDate) {
        updateData[dateField] = newDate;
      }

      return {
        id,
        data: updateData,
      };
    });

    return { tasks: updates };
  };

  // Execute batch update
  const executeBatchUpdate = async () => {
    const batchData = prepareBatchUpdate();
    if (!batchData) return;

    try {
      const result = await batchUpdateAsync(batchData);

      const successCount = result.data?.success?.length || 0;
      const failureCount = result.data?.failed?.length || 0;

      if (successCount > 0) {
        showToast({
          title: "Atualização concluída",
          message: `${successCount} tarefa(s) atualizada(s) com sucesso${failureCount > 0 ? `, ${failureCount} falhou(ram)` : ""}`,
          type: "success",
        });
        clearSelection();
        setOperationType(null);
        setNewStatus("");
        setNewSectorId("");
        setNewDate(null);
      } else {
        showToast({
          title: "Erro na atualização",
          message: "Não foi possível atualizar as tarefas selecionadas",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("[BatchOperations] Error updating tasks:", error);
      showToast({
        title: "Erro na atualização",
        message: error?.message || "Ocorreu um erro inesperado",
        type: "error",
      });
    } finally {
      setShowConfirmDialog(false);
    }
  };

  // Validate and show confirmation
  const handleApplyChanges = () => {
    if (operationType === "status" && !newStatus) {
      showToast({
        title: "Status não selecionado",
        message: "Selecione um status para atualizar",
        type: "error",
      });
      return;
    }
    if (operationType === "sector" && !newSectorId) {
      showToast({
        title: "Setor não selecionado",
        message: "Selecione um setor para reatribuir",
        type: "error",
      });
      return;
    }
    if (operationType === "date" && !newDate) {
      showToast({
        title: "Data não selecionada",
        message: "Selecione uma data para atualizar",
        type: "error",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  // Get status label
  const getStatusLabel = (status: TASK_STATUS) => {
    const labels: Record<TASK_STATUS, string> = {
      [TASK_STATUS.PENDING]: "Pendente",
      [TASK_STATUS.IN_PRODUCTION]: "Em Produção",
      [TASK_STATUS.COMPLETED]: "Concluída",
      [TASK_STATUS.CANCELLED]: "Cancelada",
      [TASK_STATUS.ON_HOLD]: "Em Espera",
      [TASK_STATUS.INVOICED]: "Faturada",
      [TASK_STATUS.SETTLED]: "Quitada",
    };
    return labels[status] || status;
  };

  // Get operation summary for confirmation
  const getOperationSummary = () => {
    const count = selectedTaskIds.size;
    if (operationType === "status") {
      return `Atualizar o status de ${count} tarefa(s) para "${getStatusLabel(newStatus as TASK_STATUS)}"`;
    }
    if (operationType === "sector") {
      const sector = sectors.find(s => s.id === newSectorId);
      return `Reatribuir ${count} tarefa(s) para o setor "${sector?.name || "Desconhecido"}"`;
    }
    if (operationType === "date") {
      const fieldLabel = dateField === "entryDate" ? "Data de Entrada" : "Prazo";
      return `Atualizar ${fieldLabel} de ${count} tarefa(s) para ${formatDate(newDate)}`;
    }
    return "";
  };

  // Render task item
  const renderTask = ({ item }: { item: any }) => {
    const isSelected = selectedTaskIds.has(item.id);

    return (
      <Pressable
        onPress={() => toggleTask(item.id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          backgroundColor: isSelected ? `${colors.primary}10` : colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        }}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleTask(item.id)}
        />

        <View style={{ flex: 1, gap: 4 }}>
          <Text className="font-semibold text-foreground">{item.name}</Text>
          <Text className="text-sm text-muted-foreground">
            Cliente: {item.customer?.name || "N/A"}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Setor: {item.sector?.name || "N/A"}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Status: {getStatusLabel(item.status)}
          </Text>
          {item.term && (
            <Text className="text-sm text-muted-foreground">
              Prazo: {formatDate(item.term)}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  // Render footer for infinite scroll
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <PrivilegeGuard
      requiredPrivilege={[SECTOR_PRIVILEGES.LEADER, SECTOR_PRIVILEGES.ADMIN]}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text className="text-2xl font-bold">Operações em Lote</Text>

          {/* Selection controls */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Button
              size="sm"
              variant="outline"
              onPress={selectAll}
              disabled={isLoadingTasks || tasks.length === 0}
            >
              <Text>Selecionar Todos</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={clearSelection}
              disabled={selectedTaskIds.size === 0}
            >
              <Text>Limpar</Text>
            </Button>
            <Text className="text-sm text-muted-foreground ml-auto">
              {selectedTaskIds.size} selecionada(s)
            </Text>
          </View>
        </View>

        {/* Task list */}
        {isLoadingTasks ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4 text-muted-foreground">Carregando tarefas...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
            <Icon name="IconClipboardList" size={48} color={colors.mutedForeground} />
            <Text className="mt-4 text-lg font-semibold">Nenhuma tarefa encontrada</Text>
            <Text className="text-sm text-muted-foreground text-center mt-2">
              Não há tarefas disponíveis para operações em lote
            </Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            style={{ flex: 1 }}
          />
        )}

        {/* Operations panel */}
        {selectedTaskIds.size > 0 && (
          <ScrollView
            style={{
              maxHeight: 300,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <View style={{ padding: 16, gap: 16 }}>
              <Text className="text-lg font-semibold">
                Operações ({selectedTaskIds.size} selecionada(s))
              </Text>

              {/* Operation type selector */}
              <View style={{ gap: 8 }}>
                <Text className="text-sm font-medium">Tipo de Operação</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    size="sm"
                    variant={operationType === "status" ? "default" : "outline"}
                    onPress={() => setOperationType("status")}
                    style={{ flex: 1 }}
                  >
                    <Text>Status</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant={operationType === "sector" ? "default" : "outline"}
                    onPress={() => setOperationType("sector")}
                    style={{ flex: 1 }}
                  >
                    <Text>Setor</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant={operationType === "date" ? "default" : "outline"}
                    onPress={() => setOperationType("date")}
                    style={{ flex: 1 }}
                  >
                    <Text>Data</Text>
                  </Button>
                </View>
              </View>

              {/* Status update */}
              {operationType === "status" && (
                <View style={{ gap: 8 }}>
                  <Text className="text-sm font-medium">Novo Status</Text>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as TASK_STATUS)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TASK_STATUS.PENDING} label={getStatusLabel(TASK_STATUS.PENDING)}>
                        {getStatusLabel(TASK_STATUS.PENDING)}
                      </SelectItem>
                      <SelectItem value={TASK_STATUS.IN_PRODUCTION} label={getStatusLabel(TASK_STATUS.IN_PRODUCTION)}>
                        {getStatusLabel(TASK_STATUS.IN_PRODUCTION)}
                      </SelectItem>
                      <SelectItem value={TASK_STATUS.COMPLETED} label={getStatusLabel(TASK_STATUS.COMPLETED)}>
                        {getStatusLabel(TASK_STATUS.COMPLETED)}
                      </SelectItem>
                      <SelectItem value={TASK_STATUS.ON_HOLD} label={getStatusLabel(TASK_STATUS.ON_HOLD)}>
                        {getStatusLabel(TASK_STATUS.ON_HOLD)}
                      </SelectItem>
                      <SelectItem value={TASK_STATUS.CANCELLED} label={getStatusLabel(TASK_STATUS.CANCELLED)}>
                        {getStatusLabel(TASK_STATUS.CANCELLED)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </View>
              )}

              {/* Sector reassignment */}
              {operationType === "sector" && (
                <View style={{ gap: 8 }}>
                  <Text className="text-sm font-medium">Novo Setor</Text>
                  <Select value={newSectorId} onValueChange={setNewSectorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id} label={sector.name}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </View>
              )}

              {/* Date modification */}
              {operationType === "date" && (
                <View style={{ gap: 8 }}>
                  <Text className="text-sm font-medium">Campo de Data</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button
                      size="sm"
                      variant={dateField === "entryDate" ? "default" : "outline"}
                      onPress={() => setDateField("entryDate")}
                      style={{ flex: 1 }}
                    >
                      <Text>Data de Entrada</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant={dateField === "term" ? "default" : "outline"}
                      onPress={() => setDateField("term")}
                      style={{ flex: 1 }}
                    >
                      <Text>Prazo</Text>
                    </Button>
                  </View>
                  <Text className="text-sm font-medium mt-2">Nova Data</Text>
                  <DateTimePicker
                    value={newDate}
                    onChange={setNewDate}
                    mode="date"
                  />
                </View>
              )}

              {/* Apply button */}
              {operationType && (
                <Button
                  onPress={handleApplyChanges}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text>Aplicar Alterações</Text>
                  )}
                </Button>
              )}
            </View>
          </ScrollView>
        )}

        {/* Confirmation dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Operação em Lote</AlertDialogTitle>
              <AlertDialogDescription>
                {getOperationSummary()}
                {"\n\n"}
                Esta ação não pode ser desfeita. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Button variant="outline">
                  <Text>Cancelar</Text>
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction>
                <Button onPress={executeBatchUpdate} disabled={isUpdating}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text>Confirmar</Text>
                  )}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </View>
    </PrivilegeGuard>
  );
}
