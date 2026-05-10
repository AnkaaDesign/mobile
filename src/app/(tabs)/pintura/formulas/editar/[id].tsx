import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, Redirect } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { usePaintFormula, useScreenReady } from "@/hooks";
import { spacing } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { PrivilegeGate } from "@/components/auth/privilege-gate";

/**
 * Edit Formula screen — formulas are managed via the paint catalog.
 * Loads the formula and redirects to the parent paint's catalog page.
 */
export default function EditFormulaScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <EditFormulaScreenInner />
    </PrivilegeGate>
  );
}

function EditFormulaScreenInner() {
  const { colors } = useTheme();
  const nav = useNav();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: response, isLoading, error } = usePaintFormula(id || "", {
    include: { paint: true },
    enabled: !!id,
  });

  useScreenReady(!isLoading);

  const formula = response?.data;

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.painting.formulas.root) });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Editar Fórmula" }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  if (error || !formula) {
    return (
      <>
        <Stack.Screen options={{ title: "Editar Fórmula" }} />
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>Erro ao carregar fórmula</ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
            Voltar
          </Button>
        </View>
      </>
    );
  }

  // Redirect to paint catalog edit since formulas are now managed there.
  if (formula.paintId) {
    return <Redirect href={mobileRoute(routes.painting.catalog.edit(formula.paintId)) as any} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: "Editar Fórmula" }} />
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
  errorText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
