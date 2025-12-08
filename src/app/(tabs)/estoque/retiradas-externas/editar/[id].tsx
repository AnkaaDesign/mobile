import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useExternalWithdrawal } from "@/hooks";
import { ExternalWithdrawalEditForm } from "@/components/inventory/external-withdrawal/form/external-withdrawal-edit-form";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";

export default function EditExternalWithdrawalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch withdrawal data with items
  const { data: response, isLoading, error, refetch } = useExternalWithdrawal(id!, {
    include: {
      receipts: true,
      items: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const withdrawal = response?.data;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !withdrawal) {
    return (
      <View style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar retirada externa"
          detail={error?.message || "Retirada externa não encontrada"}
          onRetry={refetch}
        />
      </View>
    );
  }

  return <ExternalWithdrawalEditForm withdrawal={withdrawal} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
