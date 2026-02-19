import { View, StyleSheet } from "react-native";
import { Stack, router, useLocalSearchParams, Redirect } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula, useScreenReady } from "@/hooks";
import { spacing } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";


import { Skeleton } from "@/components/ui/skeleton";

export default function EditFormulaScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  // End navigation loading overlay when screen mounts

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch formula data
  const { data: response, isLoading, error } = usePaintFormula(id || "", {
    include: {
      paint: true,
    },
    enabled: !!id && canEdit,
  });

  useScreenReady(!isLoading);

  const formula = response?.data;

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (!canEdit) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Fórmula",
          }}
        />
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>
            Você não tem permissão para editar fórmulas
          </ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
            Voltar
          </Button>
        </View>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Fórmula",
          }}
        />
        <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
          {/* Header info card */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Skeleton style={{ width: 24, height: 24, borderRadius: 4 }} />
              <Skeleton style={{ height: 18, width: '50%', borderRadius: 4 }} />
            </View>
            <Skeleton style={{ height: 13, width: '70%', borderRadius: 4 }} />
          </View>
          {/* Redirect info card */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
            <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
            <Skeleton style={{ height: 13, width: '80%', borderRadius: 4 }} />
            <Skeleton style={{ height: 13, width: '65%', borderRadius: 4 }} />
          </View>
        </View>
      </>
    );
  }

  if (error || !formula) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Fórmula",
          }}
        />
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>
            Erro ao carregar fórmula
          </ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
            Voltar
          </Button>
        </View>
      </>
    );
  }

  // Redirect to paint catalog edit since formulas are now managed there
  if (formula.paintId) {
    // For mobile, we redirect to the catalog page since the edit with tabs might not be implemented yet
    // In the future, this could redirect to: /(tabs)/pintura/catalogo/editar/${formula.paintId}?tab=formulation
    return <Redirect href={`/(tabs)/pintura/catalogo/${formula.paintId}` as any} />;
  }

  // Fallback if no paintId
  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Fórmula",
        }}
      />
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Esta fórmula não está associada a uma tinta.
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
