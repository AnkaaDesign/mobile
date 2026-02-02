
import { Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TaskFormOptimized as TaskForm } from "@/components/production/task/form";
import { useTaskDetail, useTaskMutations } from "@/hooks";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { ErrorScreen, Skeleton, ThemedScrollView, Card, CardContent } from "@/components/ui";
import { spacing } from "@/constants/design-system";

export default function EditServiceOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goBack: goBackHistory } = useNavigationHistory();
  // Fixed: isUpdating doesn't exist, use isLoading instead
  const { updateAsync, isLoading: isUpdating } = useTaskMutations();

  const { data: task, isLoading, error, refetch } = useTaskDetail(id!, {
    include: {
      customer: true,
      sector: true,
      generalPainting: true,
      paints: true,
      serviceOrders: true,
      budgets: true,
      invoices: true,
      receipts: true,
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      const result = await updateAsync({ id: id!, data });

      if (result?.data) {
        Alert.alert("Sucesso", "Ordem de serviço atualizada com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              router.replace(
                routeToMobilePath(routes.production.serviceOrders.details(id!)) as any
              );
            },
          },
        ]);
      } else {
        Alert.alert("Erro", "Erro ao atualizar ordem de serviço");
      }
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message || "Erro ao atualizar ordem de serviço. Tente novamente."
      );
    }
  };

  const handleCancel = () => {
    console.log('[EditServiceOrder] handleCancel called');
    Alert.alert(
      "Descartar Alterações",
      "Você tem alterações não salvas. Deseja descartá-las?",
      [
        { text: "Continuar Editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            console.log('[EditServiceOrder] User confirmed discard, going back');
            // Use router.back() for proper stack navigation
            if (router.canGoBack()) {
              router.back();
            } else {
              // Fallback to detail page if can't go back
              router.push(routeToMobilePath(routes.production.serviceOrders.details(id!)) as any);
            }
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedScrollView contentContainerStyle={styles.content}>
          <Card>
            <CardContent style={styles.skeletonContent}>
              <Skeleton height={24} width="60%" />
              <Skeleton height={48} width="100%" />
              <Skeleton height={48} width="100%" />
              <Skeleton height={48} width="100%" />
            </CardContent>
          </Card>
        </ThemedScrollView>
      </SafeAreaView>
    );
  }

  if (error || !task?.data) {
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

  const initialData = {
    name: task.data.name,
    customerId: task.data.customerId || "",
    sectorId: task.data.sectorId ?? null,
    serialNumber: task.data.serialNumber ?? null,
    chassisNumber: task.data.truck?.chassisNumber ?? null,
    plate: task.data.truck?.plate ?? null,
    details: task.data.details ?? null,
    entryDate: task.data.entryDate ? new Date(task.data.entryDate) : null,
    term: task.data.term ? new Date(task.data.term) : null,
    generalPaintingId: task.data.generalPainting?.id ?? null,
    // Fixed: paints doesn't exist, should use logoPaints instead
    paintIds: task.data.logoPaints?.filter((p: any) => p && p.id).map((p: any /* TODO: Add proper type */) => p.id) || [],
    services: task.data.serviceOrders?.map((s) => ({
      description: s.description,
      status: s.status ?? undefined,
    })) || [{ description: "", status: "PENDING" }],
    status: task.data.status,
    commission: task.data.commission ?? null,
    startedAt: task.data.startedAt ? new Date(task.data.startedAt) : null,
    finishedAt: task.data.finishedAt ? new Date(task.data.finishedAt) : null,
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TaskForm
        mode="edit"
        initialData={initialData}
        initialCustomer={task.data.customer}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isUpdating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  skeletonContent: {
    gap: spacing.md,
  },
});
