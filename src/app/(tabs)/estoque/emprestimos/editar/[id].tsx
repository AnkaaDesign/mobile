import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { BorrowReturnForm } from "@/components/inventory/borrow/form/borrow-return-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useBorrow, useBorrowMutations, useScreenReady } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES, BORROW_STATUS } from "@/constants";
import { isEditableStatus } from "@/constants/editable-statuses";
import { EDITABLE_BORROW_STATUSES } from "@/constants/editable-statuses";
import { BORROW_SELECT_FORM } from "@/api-client/select-patterns";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export default function BorrowEditScreenWrapper() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <BorrowEditScreen />
    </PrivilegeGate>
  );
}

function BorrowEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { updateAsync, markAsLostAsync } = useBorrowMutations();

  const { data: response, isLoading, error } = useBorrow(id!, {
    select: BORROW_SELECT_FORM,
  });

  useScreenReady(!isLoading);

  const borrow = response?.data;

  const handleReturn = async () => {
    if (!id) return;
    try {
      await nav.withLoading(async () =>
        updateAsync({
          id,
          data: { returnedAt: new Date() },
        }),
      );
      nav.replace(mobileRoute(routes.inventory.borrows.details(id)));
    } catch {
      // API client surfaces error.
    }
  };

  const handleMarkAsLost = async () => {
    if (!id) return;
    try {
      await nav.withLoading(async () => markAsLostAsync({ id }));
      nav.replace(mobileRoute(routes.inventory.borrows.details(id)));
    } catch {
      // API client surfaces error.
    }
  };

  const handleCancel = () => {
    nav.replace(mobileRoute(routes.inventory.borrows.root));
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (error || !borrow) {
    return (
      <ErrorScreen
        message="Empréstimo não encontrado"
        detail="O empréstimo que você está procurando não existe ou foi removido."
      />
    );
  }

  // Terminal status — render a read-only banner instead of the return form.
  if (!isEditableStatus(borrow.status as BORROW_STATUS, EDITABLE_BORROW_STATUSES)) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.banner, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.bannerText}>
            Este empréstimo já foi finalizado e não pode ser editado.
          </ThemedText>
          <Button onPress={handleCancel} style={{ marginTop: spacing.md }}>
            <ThemedText style={{ color: "white" }}>Voltar</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <BorrowReturnForm
        key={id}
        borrow={borrow}
        onReturn={handleReturn}
        onMarkAsLost={handleMarkAsLost}
        onCancel={handleCancel}
        isSubmitting={false}
      />
    </ThemedView>
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
