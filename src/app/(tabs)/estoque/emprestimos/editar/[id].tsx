import { View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { BorrowReturnForm } from "@/components/inventory/borrow/form/borrow-return-form";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useBorrow, useBorrowMutations, useScreenReady } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { BORROW_SELECT_FORM } from "@/api-client/select-patterns";
import { StyleSheet } from "react-native";
import { spacing } from "@/constants/design-system";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";

export default function BorrowEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <BorrowEditScreen />
    </PrivilegeGuard>
  );
}

function BorrowEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { updateAsync, markAsLostAsync } = useBorrowMutations();

  // End navigation loading overlay when screen mounts

  // Fetch borrow details with optimized select (40-60% less data)
  const {
    data: response,
    isLoading,
    error,
  } = useBorrow(id!, {
    select: BORROW_SELECT_FORM,
  });

  useScreenReady(!isLoading);

  const borrow = response?.data;

  const handleReturn = async () => {
    if (!id) return;

    try {
      await updateAsync({
        id,
        data: {
          returnedAt: new Date(),
        },
      });

      // API client already shows success alert
      router.replace(routeToMobilePath(routes.inventory.borrows.details(id)) as any);
    } catch (error) {
      // API client already shows error alert
      console.error("Error returning borrow:", error);
    }
  };

  const handleMarkAsLost = async () => {
    if (!id) return;

    try {
      await markAsLostAsync({
        id,
      });

      // API client already shows success alert
      router.replace(routeToMobilePath(routes.inventory.borrows.details(id)) as any);
    } catch (error) {
      // API client already shows error alert
      console.error("Error marking borrow as lost:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
  };

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 2 }).map((_, i) => (
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

  if (error || !borrow) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <ThemedText className="text-2xl font-semibold mb-2 text-center">Empréstimo não encontrado</ThemedText>
          <ThemedText className="text-muted-foreground mb-4 text-center">O empréstimo que você está procurando não existe ou foi removido.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText className="text-white">Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <BorrowReturnForm
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
  container: {
    flex: 1,
  },
});
