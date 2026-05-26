import { Alert, StyleSheet, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskFormWithProvider as TaskForm } from "@/components/production/task/form";
import { useTaskDetail, useTaskMutations, useScreenReady } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useStatusGuard } from "@/hooks/use-status-guard";
import { EDITABLE_TASK_STATUSES } from "@/constants/editable-statuses";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { ErrorScreen, ThemedText } from "@/components/ui";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export default function EditServiceOrderScreen() {
  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.PRODUCTION,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.COMMERCIAL,
        ],
      }}
    >
      <EditServiceOrderInner />
    </PrivilegeGate>
  );
}

function EditServiceOrderInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { updateAsync, isLoading: isUpdating } = useTaskMutations();

  const { data: task, isLoading, error, refetch } = useTaskDetail(id!, {
    include: {
      customer: { select: { id: true, fantasyName: true } },
      sector: { select: { id: true, name: true } },
      generalPainting: { select: { id: true, name: true, hex: true } },
      logoPaints: { select: { id: true, name: true, hex: true } },
      serviceOrders: {
        select: {
          id: true,
          description: true,
          status: true,
          statusOrder: true,
          type: true,
          assignedToId: true,
          observation: true,
        },
      },
      budgets: { select: { id: true, filename: true, mimetype: true, size: true } },
      invoices: { select: { id: true, filename: true, mimetype: true, size: true } },
      receipts: { select: { id: true, filename: true, mimetype: true, size: true } },
    },
  });

  useScreenReady(!isLoading);

  const taskData = task?.data;
  const guard = useStatusGuard(taskData, { editable: EDITABLE_TASK_STATUSES });

  const handleSubmit = async (data: any) => {
    try {
      const result = await nav.withLoading(async () =>
        updateAsync({ id: id!, data }),
      );

      if (result?.data) {
        nav.replace(
          mobileRoute(routes.production.serviceOrders.details(id!)),
        );
      } else {
        Alert.alert("Erro", "Erro ao atualizar ordem de serviço");
      }
    } catch {
      // Error toast is handled by the api-client interceptor.
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Descartar Alterações",
      "Você tem alterações não salvas. Deseja descartá-las?",
      [
        { text: "Continuar Editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => nav.goBack(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (error || !taskData) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ErrorScreen
          message="Erro ao carregar ordem de serviço"
          detail={error?.message || "Ordem de serviço não encontrada"}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  if (guard.isTerminal) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.banner, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.bannerText}>
            {guard.message ??
              "Esta tarefa está em um estado finalizado e não pode ser editada."}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const initialData = {
    name: taskData.name,
    customerId: taskData.customerId || "",
    sectorId: taskData.sectorId ?? null,
    serialNumber: taskData.serialNumber ?? null,
    chassisNumber: taskData.truck?.chassisNumber ?? null,
    plate: taskData.truck?.plate ?? null,
    details: taskData.details ?? null,
    entryDate: taskData.entryDate ? new Date(taskData.entryDate) : null,
    term: taskData.term ? new Date(taskData.term) : null,
    generalPaintingId: taskData.generalPainting?.id ?? null,
    paintIds:
      taskData.logoPaints
        ?.filter((p: any) => p && p.id)
        .map((p: any) => p.id) || [],
    services: taskData.serviceOrders?.map((s) => ({
      description: s.description,
      status: s.status ?? undefined,
    })) || [{ description: "", status: "PENDING" }],
    status: taskData.status,
    commission: taskData.commission ?? null,
    startedAt: taskData.startedAt ? new Date(taskData.startedAt) : null,
    finishedAt: taskData.finishedAt ? new Date(taskData.finishedAt) : null,
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TaskForm
        key={id}
        mode="edit"
        initialData={initialData}
        initialCustomer={taskData.customer}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isUpdating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  banner: {
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  bannerText: {
    fontSize: 14,
    textAlign: "center",
  },
});
