import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula } from '../../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../../constants';
import { hasPrivilege } from '../../../../../utils';
import { showToast } from "@/components/ui/toast";
import { IconFlask } from "@tabler/icons-react-native";

export default function FormulasEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch formula details
  const { data: response, isLoading, error, refetch } = usePaintFormula(id as string, {
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
        },
      },
    },
  });

  const formula = response?.data;

  if (!canEdit) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.content}>
          <Card>
            <CardContent style={styles.errorContent}>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Sem Permissão
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                Você não tem permissão para editar fórmulas.
              </ThemedText>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Carregando fórmula..." />;
  }

  if (error || !formula) {
    return (
      <ErrorScreen
        message="Erro ao carregar fórmula"
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>

        {/* Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconFlask size={24} color={colors.primary} />
              <View style={styles.headerInfo}>
                <ThemedText style={StyleSheet.flatten([styles.title, { color: colors.foreground }])}>
                  Editar Fórmula
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])}>
                  {formula.paint?.name || "Tinta"}
                </ThemedText>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Under Construction Message */}
        <Card>
          <CardContent style={styles.constructionContent}>
            <ThemedText style={StyleSheet.flatten([styles.constructionTitle, { color: colors.foreground }])}>
              Em Desenvolvimento
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.constructionDescription, { color: colors.mutedForeground }])}>
              A edição de fórmulas estará disponível em breve. No momento, você pode visualizar as fórmulas e seus componentes.
            </ThemedText>
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  headerContent: {
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fontSize.md,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  constructionContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  constructionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  constructionDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    lineHeight: 24,
  },
});
