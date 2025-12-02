import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import {
  IconUsers,
  IconUserCheck,
  IconCalendar,
  IconAlertTriangle,
  IconPackage,
  IconChartBar,
  IconShield,
  IconScissors,
  IconCurrencyDollar,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TeamMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  available: boolean;
}

export default function MinhaEquipeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const teamMenuItems: TeamMenuItem[] = [
    {
      id: "members",
      title: "Membros da Equipe",
      description: "Visualize os colaboradores do seu setor",
      icon: <IconUsers size={24} color={colors.primary} />,
      route: "/(tabs)/minha-equipe/membros/listar",
      available: true,
    },
    {
      id: "vacations",
      title: "Férias",
      description: "Visualize as férias da sua equipe",
      icon: <IconCalendar size={24} color={colors.primary} />,
      route: "/(tabs)/minha-equipe/ferias/listar",
      available: true,
    },
    {
      id: "warnings",
      title: "Advertências",
      description: "Visualize as advertências dos colaboradores",
      icon: <IconAlertTriangle size={24} color={colors.primary} />,
      route: "/(tabs)/minha-equipe/advertencias/listar",
      available: true,
    },
    {
      id: "loans",
      title: "Empréstimos",
      description: "Visualize empréstimos de equipamentos",
      icon: <IconPackage size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/emprestimos",
      available: true,
    },
    {
      id: "ppe-deliveries",
      title: "Entregas de EPI",
      description: "Visualize entregas de EPIs da equipe",
      icon: <IconShield size={24} color={colors.primary} />,
      route: "/(tabs)/minha-equipe/epi-entregas/listar",
      available: true,
    },
    {
      id: "cutting",
      title: "Recortes",
      description: "Visualize os recortes da sua equipe",
      icon: <IconScissors size={24} color={colors.primary} />,
      route: "/(tabs)/minha-equipe/recortes/listar",
      available: true,
    },
    {
      id: "commissions",
      title: "Comissões",
      description: "Visualize as comissões da sua equipe",
      icon: <IconCurrencyDollar size={24} color={colors.primary} />,
      route: "/(tabs)/minha-equipe/comissoes/listar",
      available: true,
    },
    {
      id: "performance",
      title: "Desempenho",
      description: "Visualize o desempenho da equipe",
      icon: <IconChartBar size={24} color={colors.mutedForeground} />,
      route: "/(tabs)/minha-equipe/desempenho",
      available: false,
    },
    {
      id: "attendance",
      title: "Presenças",
      description: "Visualize o registro de ponto da equipe",
      icon: <IconUserCheck size={24} color={colors.mutedForeground} />,
      route: "/(tabs)/minha-equipe/presencas",
      available: false,
    },
  ];

  const handleMenuPress = (item: TeamMenuItem) => {
    if (item.available) {
      router.push(item.route as any);
    }
  };

  // Check if user is a team leader (has managedSectorId or specific privilege)
  const isTeamLeader = user?.managedSectorId || user?.sectorId;

  if (!isTeamLeader) {
    return (
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <IconUsers size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Minha Equipe
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Gerencie os colaboradores do seu setor
          </ThemedText>
          {user?.sector && (
            <View style={[styles.sectorBadge, { backgroundColor: colors.primary + "20" }]}>
              <ThemedText style={[styles.sectorText, { color: colors.primary }]}>
                Setor: {user.sector.name}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {teamMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItemContainer}
              onPress={() => handleMenuPress(item)}
              disabled={!item.available}
              activeOpacity={item.available ? 0.7 : 1}
            >
              <Card
                style={[
                  styles.menuCard,
                  !item.available && { opacity: 0.5 },
                ]}
              >
                <View style={styles.menuIconContainer}>
                  {item.icon}
                </View>
                <ThemedText style={[styles.menuTitle, { color: colors.foreground }]}>
                  {item.title}
                </ThemedText>
                <ThemedText
                  style={[styles.menuDescription, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {item.description}
                </ThemedText>
                {!item.available && (
                  <View style={[styles.comingSoonBadge, { backgroundColor: colors.muted }]}>
                    <ThemedText style={[styles.comingSoonText, { color: colors.mutedForeground }]}>
                      Em breve
                    </ThemedText>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
          <ThemedText style={[styles.infoText, { color: colors.primary }]}>
            Como líder de equipe, você tem acesso a informações específicas dos colaboradores do seu setor.
            Use estas ferramentas para acompanhar o desempenho e bem-estar da sua equipe.
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  sectorBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  sectorText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  menuItemContainer: {
    width: "50%",
    padding: spacing.xs,
  },
  menuCard: {
    padding: spacing.md,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconContainer: {
    marginBottom: spacing.sm,
  },
  menuTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: fontSize.xs * 1.4,
  },
  comingSoonBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  infoCard: {
    padding: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
  },
});