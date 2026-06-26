import { useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { IconCalendarClock, IconChevronRight } from "@tabler/icons-react-native";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useNav } from "@/contexts/nav";
import { useExpiringMedicalExams } from "@/hooks/useMedicalExam";
import { SECTOR_PRIVILEGES, MEDICAL_EXAM_TYPE_LABELS, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { MedicalExam } from "@/types";

/** Dias até (negativo = vencido) a validade do ASO. */
function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  const ms = target.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function PeriodicExamsListScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      fallback="unauthorized"
    >
      <PeriodicExamsListScreenInner />
    </PrivilegeGate>
  );
}

function PeriodicExamsListScreenInner() {
  const { colors } = useTheme();
  const nav = useNav();
  const query = useExpiringMedicalExams(60);

  useScreenReady(!query.isLoading);

  const exams = useMemo<MedicalExam[]>(() => {
    const data = (query.data as any)?.data;
    return Array.isArray(data) ? (data as MedicalExam[]) : [];
  }, [query.data]);

  // Mais urgentes (menos dias / mais vencidos) primeiro.
  const sorted = useMemo(() => {
    return [...exams].sort((a, b) => {
      const da = daysUntil(a.expiresAt) ?? Number.MAX_SAFE_INTEGER;
      const db = daysUntil(b.expiresAt) ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });
  }, [exams]);

  const goToDetails = (exam: MedicalExam) => {
    nav.push(mobileRoute(routes.personnelDepartment.occupationalHealth.medicalExams.details(exam.id)));
  };

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ title: "Exames Periódicos / A Vencer", headerShown: true }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refresh()}
            tintColor={colors.primary}
          />
        }
      >
        {query.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconCalendarClock size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhum exame a vencer
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Não há exames realizados com validade nos próximos 60 dias.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {sorted.map((exam) => {
              const days = daysUntil(exam.expiresAt);
              const overdue = days !== null && days < 0;
              const badgeLabel =
                days === null
                  ? "—"
                  : overdue
                  ? `Vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`
                  : `Vence em ${days} dia${days !== 1 ? "s" : ""}`;
              return (
                <Pressable key={exam.id} onPress={() => goToDetails(exam)}>
                  <Card style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={styles.cardMain}>
                        <ThemedText style={StyleSheet.flatten([styles.name, { color: colors.foreground }])} numberOfLines={1}>
                          {exam.user?.name || "—"}
                        </ThemedText>
                        <ThemedText style={StyleSheet.flatten([styles.meta, { color: colors.mutedForeground }])}>
                          {exam.type ? MEDICAL_EXAM_TYPE_LABELS[exam.type] : "—"}
                          {exam.expiresAt ? ` · Validade ${new Date(exam.expiresAt).toLocaleDateString("pt-BR")}` : ""}
                        </ThemedText>
                        <View style={styles.badgeRow}>
                          <Badge variant={overdue ? "destructive" : "warning"}>
                            <ThemedText style={styles.badgeText}>{badgeLabel}</ThemedText>
                          </Badge>
                        </View>
                      </View>
                      <IconChevronRight size={20} color={colors.mutedForeground} />
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  centered: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    fontSize: fontSize.sm,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
