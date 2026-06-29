import { useMemo } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { router, usePathname } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { usePrivileges } from "@/hooks/usePrivileges";

interface TimeClockTab {
  label: string;
  route: string;
  /** Hidden from PRODUCTION_MANAGER (PM only sees Colaborador, Dia, Ausências). */
  hrOnly?: boolean;
}

const TABS: TimeClockTab[] = [
  { label: "Colaborador", route: "/departamento-pessoal/controle-ponto/colaborador" },
  { label: "Dia", route: "/departamento-pessoal/controle-ponto/dia" },
  { label: "Edição", route: "/departamento-pessoal/controle-ponto/edicao", hrOnly: true },
  { label: "Ausências", route: "/departamento-pessoal/controle-ponto/ausencias" },
  { label: "Fechamento", route: "/departamento-pessoal/controle-ponto/fechamento", hrOnly: true },
  { label: "Requisições", route: "/departamento-pessoal/requisicoes/listar", hrOnly: true },
];

/**
 * Horizontal segmented control rendered at the top of every Controle de Ponto
 * sub-view. The active tab is matched against the current pathname. PM users
 * (PRODUCTION_MANAGER) only see the read-focused tabs.
 */
export function TimeClockTabs() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { isProductionManager } = usePrivileges();

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !(tab.hrOnly && isProductionManager)),
    [isProductionManager],
  );

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {visibleTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.route);
          return (
            <TouchableOpacity
              key={tab.route}
              activeOpacity={0.7}
              onPress={() => {
                if (!isActive) router.push(tab.route as never);
              }}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
