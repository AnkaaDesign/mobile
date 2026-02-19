import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useExternalWithdrawal, useScreenReady} from '@/hooks';
import { ExternalWithdrawalEditForm } from "@/components/inventory/external-withdrawal/form/external-withdrawal-edit-form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";


export default function EditExternalWithdrawalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

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

  useScreenReady(!isLoading);

  const withdrawal = response?.data;

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
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
