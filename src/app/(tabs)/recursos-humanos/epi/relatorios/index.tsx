
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChartBar, IconPackage, IconActivity, IconMask } from "@tabler/icons-react-native";

import { ThemedView, ThemedText } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useScreenReady } from '@/hooks/use-screen-ready';

interface ReportCard {
  title: string;
  description: string;
  icon: typeof IconPackage;
  path?: string;
  color: string;
  bgColor: string;
}

export default function PpeReportsScreen() {
  useScreenReady();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const reportCards: ReportCard[] = [
    {
      title: "Relatório de Estoque",
      description: "Visualize os níveis de estoque por tipo e tamanho de EPI",
      icon: IconPackage,
      path: undefined, // Not implemented yet
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.1)",
    },
    {
      title: "Estatísticas de Uso",
      description: "Análise de consumo e distribuição de EPIs por período",
      icon: IconActivity,
      path: undefined, // Not implemented yet
      color: "#16a34a",
      bgColor: "rgba(22, 163, 74, 0.1)",
    },
    {
      title: "Inventário de Máscaras",
      description: "Relatório específico para estoque e distribuição de máscaras",
      icon: IconMask,
      path: undefined, // Not implemented yet
      color: "#9333ea",
      bgColor: "rgba(147, 51, 234, 0.1)",
    },
  ];

  const handleReportPress = (report: ReportCard) => {
    if (report.path) {
      router.push(report.path as any);
    } else {
      // Show under construction message
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Relatórios de EPI</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Visualize relatórios e análises sobre o estoque e distribuição de Equipamentos de Proteção Individual
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Report Cards */}
        <View style={styles.cardsGrid}>
          {reportCards.map((report, index) => {
            const Icon = report.icon;
            return (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.reportCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => handleReportPress(report)}
              >
                <View style={[styles.iconContainer, { backgroundColor: report.bgColor }]}>
                  <Icon size={24} color={report.color} />
                </View>
                <ThemedText style={styles.cardTitle}>{report.title}</ThemedText>
                <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                  {report.description}
                </ThemedText>
                {!report.path && (
                  <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                    <ThemedText style={[styles.badgeText, { color: colors.mutedForeground }]}>
                      Em breve
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.overviewHeader}>
            <IconChartBar size={20} color={colors.foreground} />
            <ThemedText style={styles.overviewTitle}>Visão Geral</ThemedText>
          </View>
          <ThemedText style={[styles.overviewText, { color: colors.mutedForeground }]}>
            Os relatórios de EPI fornecem insights valiosos sobre:
          </ThemedText>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.bulletText}>
                Níveis de estoque atuais por tipo e tamanho
              </ThemedText>
            </View>
            <View style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.bulletText}>
                Distribuição de tamanhos mais utilizados
              </ThemedText>
            </View>
            <View style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.bulletText}>
                Tendências de consumo ao longo do tempo
              </ThemedText>
            </View>
            <View style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.bulletText}>
                Alertas de estoque baixo ou necessidade de reposição
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardsGrid: {
    gap: 16,
    marginBottom: 16,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  overviewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    gap: 12,
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
