import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Alert , StyleSheet} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { IconButton, IconButtonWithLabel } from "@/components/ui/icon-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useTaskMutations } from '../../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { TASK_STATUS, SECTOR_PRIVILEGES, TASK_STATUS_LABELS } from '../../../../../constants';
import { hasPrivilege, formatCurrency } from '../../../../../utils';
import { showToast } from "@/components/ui/toast";
import { TaskInfoCard } from "@/components/production/task/detail/task-info-card";
import { TaskServicesCard } from "@/components/production/task/detail/task-services-card";
import { TaskCustomerCard } from "@/components/production/task/detail/task-customer-card";
import { TaskTimelineCard } from "@/components/production/task/detail/task-timeline-card";
import { TaskAttachmentsCard } from "@/components/production/task/detail/task-attachments-card";

export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update, delete: deleteAsync } = useTaskMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch task details
  const { data: response, isLoading, error, refetch } = useTaskDetail(id as string, {
    include: {
      customer: true,
      sector: true,
      services: true,
      files: true,
      activities: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          services: true,
          files: true,
        },
      },
    },
  });

  const task = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Detalhes atualizados", type: "success" });
  };

  // Handle status change
  const handleStatusChange = async (newStatus: TASK_STATUS) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para alterar o status", type: "error" });
      return;
    }

    if (!task) return;

    try {
      const updateData: any = { status: newStatus };

      // Add timestamps based on status
      if (newStatus === TASK_STATUS.IN_PRODUCTION && !task.startedAt) {
        updateData.startedAt = new Date();
      } else if (newStatus === TASK_STATUS.COMPLETED && !task.finishedAt) {
        updateData.finishedAt = new Date();
      }

      await update({ id: task.id, data: updateData });
      showToast({ message: `Status alterado para ${TASK_STATUS_LABELS[newStatus as keyof typeof TASK_STATUS_LABELS]}`, type: "success" });
      refetch();
    } catch (error) {
      showToast({ message: "Erro ao alterar status", type: "error" });
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/production/schedule/edit/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tarefa",
      "Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Tarefa excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir tarefa", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Get available status actions
  const getStatusActions = () => {
    if (!task || !canEdit) return [];

    const actions = [];

    switch (task.status) {
      case TASK_STATUS.PENDING:
        actions.push({
          label: "Iniciar Produção",
          status: TASK_STATUS.IN_PRODUCTION,
          icon: "play" as const,
          color: colors.primary,
        });
        break;
      case TASK_STATUS.IN_PRODUCTION:
        actions.push(
          {
            label: "Pausar",
            status: TASK_STATUS.ON_HOLD,
            icon: "pause" as const,
            color: "#f59e0b",
          },
          {
            label: "Concluir",
            status: TASK_STATUS.COMPLETED,
            icon: "check" as const,
            color: "#10b981",
          }
        );
        break;
      case TASK_STATUS.ON_HOLD:
        actions.push({
          label: "Retomar",
          status: TASK_STATUS.IN_PRODUCTION,
          icon: "play" as const,
          color: colors.primary,
        });
        break;
      default:
        break;
    }

    if (task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.CANCELLED) {
      actions.push({
        label: "Cancelar",
        status: TASK_STATUS.CANCELLED,
        icon: "x" as const,
        color: colors.destructive,
      });
    }

    return actions;
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da tarefa..." />;
  }

  if (error || !task) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da tarefa"
        onRetry={refetch}
      />
    );
  }

  const statusActions = getStatusActions();

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* Header */}
      <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {task.name}
          </ThemedText>
          {task.serialNumber && (
            <ThemedText style={styles.subtitle}>
              NS: {task.serialNumber}
            </ThemedText>
          )}
        </View>
        <View style={styles.headerActions}>
          {canEdit && (
            <IconButton
              name="edit"
              variant="default"
              onPress={handleEdit}
            />
          )}
          {canDelete && (
            <IconButton
              name="trash"
              variant="default"
              onPress={handleDelete}
            />
          )}
        </View>
      </View>

      {/* Status actions */}
      {statusActions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={StyleSheet.flatten([styles.actionsContainer, { backgroundColor: colors.card }])}
          contentContainerStyle={styles.actionsContent}
        >
          {statusActions.map((action) => (
            <IconButtonWithLabel
              key={action.status}
              name={action.icon}
              label={action.label}
              variant="default"
             
              showBackground
              backgroundColor="transparent"
              borderRadius={8}
              onPress={() => handleStatusChange(action.status)}
            />
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Task info */}
          <TaskInfoCard task={task} />

          {/* Customer info */}
          {task.customer && <TaskCustomerCard customer={task.customer} />}

          {/* Services */}
          {task.services && task.services.length > 0 && (
            <TaskServicesCard services={task.services} />
          )}

          {/* Timeline */}
          <TaskTimelineCard task={task} activities={(task as any)?.activities} />


          {/* Attachments */}
          {(task as any)?.files && (task as any).files.length > 0 && (
            <TaskAttachmentsCard files={(task as any)?.files} />
          )}

          {/* Financial summary */}
          {task.price && (
            <View style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: colors.card }])}>
              <ThemedText style={styles.summaryLabel}>Valor Total</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatCurrency(task.price)}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionsContainer: {
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  actionsContent: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 120,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
  },
});
