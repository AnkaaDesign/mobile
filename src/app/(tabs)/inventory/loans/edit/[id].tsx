import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { BorrowReturnForm } from "@/components/inventory/borrow/form/borrow-return-form";
import { SkeletonCard } from "@/components/ui/loading";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useBorrow, useBorrowMutations } from '../../../../../hooks';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes, SECTOR_PRIVILEGES } from '../../../../../constants';
import { StyleSheet } from "react-native";
import { spacing } from "@/constants/design-system";

export default function LoanEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <LoanEditScreen />
    </PrivilegeGuard>
  );
}

function LoanEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync, markAsLostAsync } = useBorrowMutations();

  const {
    data: response,
    isLoading,
    error,
  } = useBorrow(id!, {
    include: {
      item: {
        include: {
          brand: true,
        },
      },
      user: true,
    },
  });

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

      showToast({
        message: "Empréstimo marcado como devolvido!",
        type: "success",
      });
      router.replace(routeToMobilePath(routes.inventory.loans.root));
    } catch (error) {
      console.error("Error returning borrow:", error);
    }
  };

  const handleMarkAsLost = async () => {
    if (!id) return;

    try {
      await markAsLostAsync({
        id,
      });

      showToast({
        message: "Empréstimo marcado como perdido!",
        type: "success",
      });
      router.replace(routeToMobilePath(routes.inventory.loans.root));
    } catch (error) {
      console.error("Error marking borrow as lost:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.loans.root));
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
        </View>
      </ThemedView>
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
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeleton: {
    height: 200,
  },
});
