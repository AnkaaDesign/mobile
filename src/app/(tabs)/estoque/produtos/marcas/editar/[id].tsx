import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
// import { showToast } from "@/components/ui/toast";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItemBrand, useItemBrandMutations, useScreenReady } from "@/hooks";
import { type ItemBrandUpdateFormData } from '../../../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";


import { Skeleton } from "@/components/ui/skeleton";

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
  const { goBack } = useNavigationLoading();

  // End navigation loading overlay when screen mounts

  const {
    data: response,
    isLoading,
    error,
  } = useItemBrand(id!, {
    // Use select to fetch only fields needed for the edit form
    // No need to include items - only editing name
    select: {
      id: true,
      name: true,
    },
  });

  useScreenReady(!isLoading);

  const brand = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemBrandUpdateFormData>) => {
    if (!id) return;

    try {
      console.log("Sending only changed fields:", changedData);

      await updateAsync({
        id,
        data: changedData,
      });

      // API client already shows success alert
      router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
    } catch (error) {
      // API client already shows error alert
      console.error("Error updating brand:", error);
    }
  };

  const handleCancel = () => {
    goBack({ fallbackRoute: routeToMobilePath(routes.inventory.products.brands.root) });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
        <Skeleton style={{ height: 24, width: '40%', borderRadius: 4 }} />
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '70%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
        </View>
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
