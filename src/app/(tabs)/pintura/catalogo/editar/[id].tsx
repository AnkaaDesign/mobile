import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { SkeletonCard } from "@/components/ui/loading";
import { usePaint, usePaintMutations } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";
import { spacing } from "@/constants/design-system";

export default function EditCatalogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync, isLoading } = usePaintMutations();

  const {
    data: response,
    isLoading: isLoadingPaint,
    error,
  } = usePaint(id!, {
    include: {
      paintType: true,
      paintBrand: true,
      paintGrounds: {
        include: {
          groundPaint: true,
        },
      },
    },
  });

  const paint = response?.data;

  const handleSubmit = async (data: any) => {
    if (!id) return;

    try {
      const result = await updateAsync({ id, data });

      if (result.success) {
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error updating paint:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
  };

  if (isLoadingPaint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Tinta",
            headerBackTitle: "Voltar",
          }}
        />
        <ThemedView style={styles.container}>
          <View style={styles.skeletonContainer}>
            <SkeletonCard style={styles.skeleton} />
            <SkeletonCard style={styles.skeleton} />
            <SkeletonCard style={styles.skeleton} />
          </View>
        </ThemedView>
      </>
    );
  }

  if (error || !paint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Tinta",
            headerBackTitle: "Voltar",
          }}
        />
        <ThemedView className="flex-1">
          <View className="flex-1 items-center justify-center px-4">
            <ThemedText className="text-2xl font-semibold mb-2 text-center">Tinta não encontrada</ThemedText>
            <ThemedText className="text-muted-foreground mb-4 text-center">
              A tinta que você está procurando não existe ou foi removida.
            </ThemedText>
            <Button onPress={handleCancel}>
              <ThemedText className="text-white">Voltar para lista</ThemedText>
            </Button>
          </View>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ThemedView className="flex-1">
        <PaintForm
          mode="update"
          paintId={id!}
          defaultValues={{
            name: paint.name,
            code: paint.code,
            hex: paint.hex,
            finish: paint.finish,
            paintTypeId: paint.paintTypeId,
            paintBrandId: paint.paintBrandId,
            manufacturer: paint.manufacturer,
            tags: paint.tags || [],
            groundIds: paint.paintGrounds?.map((g) => g.groundPaintId) || [],
          }}
          initialGrounds={paint.paintGrounds?.map((g) => g.groundPaint).filter((g): g is NonNullable<typeof g> => g !== undefined) || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isLoading}
        />
      </ThemedView>
    </>
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
