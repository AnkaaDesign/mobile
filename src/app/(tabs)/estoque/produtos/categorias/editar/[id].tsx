import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
// import { showToast } from "@/components/ui/toast";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemCategoryForm } from "@/components/inventory/item/category/form/category-form";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItemCategory, useItemCategoryMutations } from "@/hooks";
import { type ItemCategoryUpdateFormData } from '../../../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export default function CategoryEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <CategoryEditScreen />
    </PrivilegeGuard>
  );
}

function CategoryEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemCategoryMutations();

  const {
    data: response,
    isLoading,
    error,
  } = useItemCategory(id!, {
    include: {
      items: true,
    },
  });

  const category = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemCategoryUpdateFormData>) => {
    if (!id) return;

    try {
      console.log("Sending only changed fields:", changedData);

      await updateAsync({
        id,
        data: changedData,
      });

      // API client already shows success alert
      router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
    } catch (error) {
      // API client already shows error alert
      console.error("Error updating category:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
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

  if (error || !category) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Categoria não encontrada</ThemedText>
          <ThemedText style={styles.errorMessage}>A categoria que você está procurando não existe ou foi removida.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={styles.buttonText}>Voltar para lista</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ItemCategoryForm
      mode="update"
      defaultValues={{
        name: category.name,
        type: category.type,
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
