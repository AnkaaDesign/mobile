import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useExternalOperation, useScreenReady } from "@/hooks";
import { ExternalOperationEditForm } from "@/components/inventory/external-operation/form/external-operation-edit-form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { EDITABLE_EXTERNAL_OPERATION_STATUSES } from "@/constants/editable-statuses";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export default function EditExternalOperationScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN] }}>
      <EditExternalOperationScreenInner />
    </PrivilegeGate>
  );
}

function EditExternalOperationScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const { data: response, isLoading, error, refetch } = useExternalOperation(id!, {
    include: {
      receipts: true,
      items: {
        include: {
          item: { include: { brands: true, category: true } },
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
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 5 }).map((_, i) => (
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
          message="Erro ao carregar operação externa"
          detail={error?.message || "Operação externa não encontrada"}
          onRetry={refetch}
        />
      </View>
    );
  }

  // Status guard: deep links must not reach the edit form on finalized
  // operations (e.g., CHARGED/LIQUIDATED) — only PENDING/PARTIALLY_RETURNED.
  if (
    !withdrawal.status ||
    !EDITABLE_EXTERNAL_OPERATION_STATUSES.includes(withdrawal.status as any)
  ) {
    return (
      <View style={styles.container}>
        <ErrorScreen
          message="Operação não editável neste status"
          detail="Apenas operações pendentes ou parcialmente devolvidas podem ser editadas."
        />
      </View>
    );
  }

  return <ExternalOperationEditForm key={id} withdrawal={withdrawal} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
