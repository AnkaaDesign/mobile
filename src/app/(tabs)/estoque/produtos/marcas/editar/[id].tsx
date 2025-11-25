import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToast } from "@/components/ui/toast";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItemBrand, useItemBrandMutations } from "@/hooks";
import { type ItemBrandUpdateFormData } from '../../../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export default function BrandEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <BrandEditScreen />
    </PrivilegeGuard>
  );
}

function BrandEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemBrandMutations();

  const {
    data: response,
    isLoading,
    error,
  } = useItemBrand(id!, {
    include: {
      items: true,
    },
  });

  const brand = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemBrandUpdateFormData>) => {
    if (!id) return;

    try {
      console.log("Sending only changed fields:", changedData);

      await updateAsync({
        id,
        data: changedData,
      });

      showToast({
        message: "Marca atualizada com sucesso!",
        type: "success",
      });
      router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error updating brand:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !brand) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Marca não encontrada</ThemedText>
          <ThemedText style={styles.errorMessage}>A marca que você está procurando não existe ou foi removida.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={styles.buttonText}>Voltar para lista</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ItemBrandForm
      mode="update"
      defaultValues={{
        name: brand.name,
      }}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      isSubmitting={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    marginBottom: spacing.lg,
    textAlign: "center",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
  },
});
