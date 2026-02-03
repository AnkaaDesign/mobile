import { View, ScrollView, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useScreenReady } from "@/hooks";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
import {
  IconFlask,
  IconInfoCircle,
  IconPalette,
} from "@tabler/icons-react-native";

export default function CreateFormulaScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Handle navigation to catalog
  const handleGoToCatalog = () => {
    router.push("/(tabs)/pintura/catalogo");
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (!canCreate) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para criar fórmulas
        </ThemedText>
        <Button variant="outline" onPress={handleCancel} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Nova Fórmula",
          headerBackTitle: "Cancelar",
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <IconInfoCircle size={48} color={colors.primary} />
            <ThemedText style={styles.infoTitle}>Fórmulas são gerenciadas através do Catálogo</ThemedText>
            <ThemedText style={styles.infoDescription}>
              Para criar uma nova fórmula, você precisa acessar o Catálogo de Tintas e criar ou editar uma tinta.
              As fórmulas são gerenciadas diretamente na página de edição da tinta.
            </ThemedText>
          </View>
        </Card>

        {/* Instructions Card */}
        <Card style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <IconFlask size={24} color={colors.primary} />
            <ThemedText style={styles.instructionsTitle}>Como criar uma fórmula:</ThemedText>
          </View>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={StyleSheet.flatten([styles.instructionNumber, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.instructionNumberText, { color: colors.primaryForeground }])}>
                  1
                </ThemedText>
              </View>
              <ThemedText style={styles.instructionText}>
                Acesse o Catálogo de Tintas
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <View style={StyleSheet.flatten([styles.instructionNumber, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.instructionNumberText, { color: colors.primaryForeground }])}>
                  2
                </ThemedText>
              </View>
              <ThemedText style={styles.instructionText}>
                Crie uma nova tinta ou selecione uma tinta existente
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <View style={StyleSheet.flatten([styles.instructionNumber, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.instructionNumberText, { color: colors.primaryForeground }])}>
                  3
                </ThemedText>
              </View>
              <ThemedText style={styles.instructionText}>
                Na página de edição da tinta, navegue até a aba "Formulação"
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <View style={StyleSheet.flatten([styles.instructionNumber, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.instructionNumberText, { color: colors.primaryForeground }])}>
                  4
                </ThemedText>
              </View>
              <ThemedText style={styles.instructionText}>
                Adicione os componentes e suas proporções para criar a fórmula
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.actionButton}
          >
            Voltar
          </Button>
          <Button
            onPress={handleGoToCatalog}
            style={styles.actionButton}
            icon={<IconPalette size={20} color={colors.primaryForeground} />}
          >
            Ir para Catálogo
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
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
  infoCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  infoContent: {
    alignItems: "center",
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  infoDescription: {
    fontSize: fontSize.md,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
  },
  instructionsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  instructionsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  instructionsList: {
    gap: spacing.md,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  instructionText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
    paddingTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
