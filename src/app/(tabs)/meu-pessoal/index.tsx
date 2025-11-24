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
  IconCalendar,
  IconAlertTriangle,
  IconPackage,
  IconClock,
  IconShieldCheck,
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

export default function MeuPessoalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: user } = useAuth();

  // Check if user is a team leader (has managedSectorId)
  const isTeamLeader = user?.managedSectorId || false;

  const teamMenuItems: TeamMenuItem[] = [
    {
      id: "users",
      title: "Usuários",
      description: "Visualize os membros da sua equipe",
      icon: <IconUsers size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/usuarios",
      available: true,
    },
    {
      id: "activities",
      title: "Atividades",
      description: "Acompanhe as atividades da equipe",
      icon: <IconClock size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/atividades",
      available: true,
    },
    {
      id: "epis",
      title: "EPIs",
      description: "Gerencie os EPIs da sua equipe",
      icon: <IconShieldCheck size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/epis",
      available: true,
    },
    {
      id: "vacations",
      title: "Férias",
      description: "Visualize as férias da equipe",
      icon: <IconCalendar size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/ferias",
      available: true,
    },
    {
      id: "warnings",
      title: "Advertências",
      description: "Advertências dos colaboradores",
      icon: <IconAlertTriangle size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/advertencias",
      available: true,
    },
    {
      id: "loans",
      title: "Empréstimos",
      description: "Empréstimos de equipamentos",
      icon: <IconPackage size={24} color={colors.primary} />,
      route: "/(tabs)/meu-pessoal/emprestimos",
      available: true,
    },
  ];

  const handleMenuPress = (item: TeamMenuItem) => {
    if (item.available) {
      router.push(item.route as any);
    }
  };

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
            <ThemedText style={[styles.emptyInfo, { color: colors.mutedForeground }]}>
              Como líder, você teria acesso a:
            </ThemedText>
            <View style={styles.featuresList}>
              <ThemedText style={[styles.featureItem, { color: colors.mutedForeground }]}>
                • Visualizar membros da equipe
              </ThemedText>
              <ThemedText style={[styles.featureItem, { color: colors.mutedForeground }]}>
                • Acompanhar atividades
              </ThemedText>
              <ThemedText style={[styles.featureItem, { color: colors.mutedForeground }]}>
                • Gerenciar EPIs
              </ThemedText>
              <ThemedText style={[styles.featureItem, { color: colors.mutedForeground }]}>
                • Controlar férias e advertências
              </ThemedText>
            </View>
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
            Meu Pessoal
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
              <Card style={styles.menuCard}>
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
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
          <ThemedText style={[styles.infoText, { color: colors.primary }]}>
            Como líder de equipe, você pode visualizar informações e métricas dos colaboradores
            do seu setor. Todas as informações são somente leitura.
          </ThemedText>
        </Card>

        {/* Note about Minha Equipe */}
        <Card style={[styles.noteCard, { backgroundColor: colors.muted }]}>
          <ThemedText style={[styles.noteTitle, { color: colors.foreground }]}>
            Nota
          </ThemedText>
          <ThemedText style={[styles.noteText, { color: colors.mutedForeground }]}>
            Para uma visão mais detalhada dos membros da equipe, acesse também a seção
            "Minha Equipe" no menu.
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
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  noteCard: {
    padding: spacing.md,
  },
  noteTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  noteText: {
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
    marginBottom: spacing.lg,
  },
  emptyInfo: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  featuresList: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
  },
  featureItem: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
});