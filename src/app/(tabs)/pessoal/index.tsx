import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
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
  IconClipboardList,
  IconMessageCircle,
  IconBeach,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMyQuestionnaireEntries } from "@/hooks/useQuestionnaire";
import { CONTRACT_STATUS, EMPLOYEE_TYPE } from "@/constants";
import { useScreenReady } from '@/hooks/use-screen-ready';

interface PersonalMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  available: boolean;
  requiresBonifiable?: boolean;
  requiresOpenQuestionnaire?: boolean;
}

export default function PessoalScreen() {
  useScreenReady();
  const nav = useNav();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: currentUser } = useCurrentUser();

  // Check if user is eligible for bonus: confirmed CLT bond (employeeType CLT && status ACTIVE)
  // + bonifiable position.
  const isBonifiable = currentUser?.currentEmployeeType === EMPLOYEE_TYPE.CLT &&
    currentUser?.currentContractStatus === CONTRACT_STATUS.ACTIVE &&
    currentUser?.position?.bonifiable === true;

  // Mirror the web sidebar gate (useMyPendingQuestionnaireEntries): show the
  // Questionários entry to ANY sector, but only while the user has at least one
  // non-submitted entry. Keep it visible while the queue is still unknown so it
  // doesn't flash in after load.
  const { data: questionnaireResp } = useMyQuestionnaireEntries();
  const hasOpenQuestionnaire = useMemo(() => {
    if (!questionnaireResp) return true;
    return ((questionnaireResp.data ?? []) as { status: string }[]).some(
      (e) => e.status !== "SUBMITTED",
    );
  }, [questionnaireResp]);

  const allMenuItems: PersonalMenuItem[] = [
    {
      id: "questionnaires",
      title: "Questionários",
      description: "Responder questionário",
      icon: <IconClipboardList size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/questionarios",
      available: true,
      requiresOpenQuestionnaire: true,
    },
    {
      id: "holidays",
      title: "Meus Feriados",
      description: "Feriados do ano",
      icon: <IconCalendarEvent size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/meus-feriados",
      available: true,
    },
    {
      id: "vacations",
      title: "Minhas Férias",
      description: "Períodos de férias",
      icon: <IconBeach size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/minhas-ferias",
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
      route: "/(tabs)/pessoal/meus-emprestimos",
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
      id: "messages",
      title: "Minhas Mensagens",
      description: "Mensagens e comunicados",
      icon: <IconMessageCircle size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/minhas-mensagens",
      available: true,
    },
    {
      id: "warnings",
      title: "Minhas Advertências",
      description: "Registros de advertências",
      icon: <IconAlertTriangle size={28} color={colors.primary} />,
      route: "/(tabs)/pessoal/minhas-advertencias",
      available: true,
    },
  ];

  // Filter menu items based on bonifiable status
  const personalMenuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      if (item.requiresBonifiable && !isBonifiable) {
        return false;
      }
      if (item.requiresOpenQuestionnaire && !hasOpenQuestionnaire) {
        return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBonifiable, hasOpenQuestionnaire, colors.primary]);

  const handleMenuPress = (item: PersonalMenuItem) => {
    if (item.available) {
      nav.push(mobileRoute(item.route));
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
          {personalMenuItems.map((item) => {
            return (
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
            );
          })}
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
