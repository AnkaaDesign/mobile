import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconUsers, IconList, IconSearch } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FuncionariosIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      id: "list",
      title: "Listar Funcionários",
      description: "Visualize todos os funcionários da empresa",
      icon: <IconList size={24} color={colors.primary} />,
      route: "/(tabs)/pessoal/funcionarios/listar",
    },
    {
      id: "search",
      title: "Buscar Funcionário",
      description: "Encontre um funcionário específico",
      icon: <IconSearch size={24} color={colors.primary} />,
      route: "/(tabs)/pessoal/funcionarios/listar",
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconUsers size={32} color={colors.primary} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Funcionários
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Consulte informações dos funcionários da empresa
          </ThemedText>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMenuPress(item.route)}
              activeOpacity={0.7}
            >
              <Card style={styles.menuCard}>
                <View style={styles.menuContent}>
                  <View style={styles.menuIcon}>{item.icon}</View>
                  <View style={styles.menuText}>
                    <ThemedText style={[styles.menuTitle, { color: colors.foreground }]}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.menuDescription, { color: colors.mutedForeground }]}>
                      {item.description}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: colors.muted }]}>
          <IconUsers size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Esta seção permite visualizar informações públicas dos funcionários.
            Dados sensíveis como documentos e informações salariais estão restritos.
          </ThemedText>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  menuContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  menuCard: {
    padding: spacing.md,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: fontSize.sm,
  },
  infoCard: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    marginLeft: spacing.sm,
    flex: 1,
  },
});