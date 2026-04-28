import React from "react";
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { useScreenReady } from "@/hooks/use-screen-ready";

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
  route: string;
}

const TOOLS: ToolItem[] = [
  {
    id: "color-palette",
    title: "Paleta de Cores",
    description: "Visualize todas as tintas catalogadas agrupadas por tipo e acabamento.",
    icon: "palette",
    iconColor: "#6366f1",
    iconBackground: "rgba(99, 102, 241, 0.12)",
    route: "/(tabs)/tools/color-palette",
  },
  {
    id: "time-calculator",
    title: "Calculadora de Horas",
    description: "Calcule diferenças entre horários e some intervalos de tempo.",
    icon: "clock",
    iconColor: "#0ea5e9",
    iconBackground: "rgba(14, 165, 233, 0.12)",
    route: "/(tabs)/tools/time-calculator",
  },
  {
    id: "overtime-cost-calculator",
    title: "Custo de Horas Extras",
    description: "Cálculo de horas extras para metalúrgicos",
    icon: "calendarDollar",
    iconColor: "#f59e0b",
    iconBackground: "rgba(245, 158, 11, 0.12)",
    route: "/(tabs)/tools/overtime-cost-calculator",
  },
  {
    id: "paint-mix-calculator",
    title: "Calculadora de Mistura",
    description: "Calcule proporções de mistura de tintas a partir de uma fórmula.",
    icon: "flask",
    iconColor: "#10b981",
    iconBackground: "rgba(16, 185, 129, 0.12)",
    route: "/(tabs)/tools/paint-mix-calculator",
  },
];

export default function ToolsHubScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  useScreenReady();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText
            style={{
              fontSize: fontSize["2xl"],
              fontWeight: fontWeight.bold,
              color: colors.foreground,
            }}
          >
            Ferramentas
          </ThemedText>
          <ThemedText
            style={{
              fontSize: fontSize.sm,
              color: colors.mutedForeground,
              marginTop: spacing.xs,
            }}
          >
            Utilitários para o dia a dia da operação
          </ThemedText>
        </View>

        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => router.push(tool.route as any)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: isDark ? "#000" : "#000",
                  shadowOpacity: isDark ? 0.3 : 0.05,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 2,
                  elevation: 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: tool.iconBackground },
                ]}
              >
                <Icon name={tool.icon} size="lg" color={tool.iconColor} />
              </View>

              <View style={styles.cardContent}>
                <ThemedText
                  style={{
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.semibold,
                    color: colors.foreground,
                  }}
                >
                  {tool.title}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.mutedForeground,
                    marginTop: spacing.xxs,
                  }}
                  numberOfLines={2}
                >
                  {tool.description}
                </ThemedText>
              </View>

              <Icon name="chevron-right" size="md" color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  grid: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
});
