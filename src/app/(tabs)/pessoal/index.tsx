import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import {
  IconCalendar,
  IconCalendarEvent,
  IconShield,
  IconPackage,
  IconActivity,
  IconAlertTriangle,
  IconCoin,
  IconClock,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentUser } from "@/hooks/useAuth";
import { USER_STATUS } from "@/constants";

interface PersonalMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  available: boolean;
  requiresBonifiable?: boolean;
}

export default function PessoalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: currentUser } = useCurrentUser();

  // Check if user is eligible for bonus (must be EFFECTED and have bonifiable position)
  const isBonifiable = currentUser?.status === USER_STATUS.EFFECTED &&
    currentUser?.position?.bonifiable === true;

  const allMenuItems: PersonalMenuItem[] = [
    {
      id: "holidays",
      title: "Meus Feriados",
      description: "Feriados do ano",
      icon: <IconCalendarEvent size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/meus-feriados/listar",
      available: true,
    },
    {
      id: "vacations",
      title: "Minhas Férias",
      description: "Acompanhe suas férias",
      icon: <IconCalendar size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/minhas-ferias/listar",
      available: true,
    },
    {
      id: "ppes",
      title: "Meus EPIs",
      description: "Equipamentos de proteção",
      icon: <IconShield size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/meus-epis",
      available: true,
    },
    {
      id: "loans",
      title: "Meus Empréstimos",
      description: "Ferramentas emprestadas",
      icon: <IconPackage size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/meus-emprestimos/listar",
      available: true,
    },
    {
      id: "movements",
      title: "Minhas Movimentações",
      description: "Histórico de movimentações",
      icon: <IconActivity size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/minhas-movimentacoes/listar",
      available: true,
    },
    {
      id: "bonus",
      title: "Meu Bônus",
      description: "Bônus e simulações",
      icon: <IconCoin size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/meu-bonus",
      available: true,
      requiresBonifiable: true,
    },
    {
      id: "points",
      title: "Meus Pontos",
      description: "Registro de ponto",
      icon: <IconClock size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/meus-pontos",
      available: true,
    },
    {
      id: "warnings",
      title: "Minhas Advertências",
      description: "Registros de advertências",
      icon: <IconAlertTriangle size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/minhas-advertencias/listar",
      available: true,
    },
  ];

  // Filter menu items based on bonifiable status
  const personalMenuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      if (item.requiresBonifiable && !isBonifiable) {
        return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBonifiable, colors.primary]);

  const handleMenuPress = (item: PersonalMenuItem) => {
    if (item.available) {
      router.push(item.route as any);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuGrid}>
          {personalMenuItems.map((item) => (
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
                <ThemedText
                  style={[styles.menuTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
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
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  menuItemContainer: {
    width: "50%",
    padding: spacing.xs,
  },
  menuCard: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconContainer: {
    marginBottom: spacing.xs,
  },
  menuTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: fontSize.xs * 1.3,
    height: fontSize.xs * 1.3 * 2,
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
});
