import { View, ScrollView, StyleSheet, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useCallback } from "react";

import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { spacing, fontSize } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { PageHeader } from "@/components/ui/page-header";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { usePpeDeliverySchedule, usePpeDeliveryScheduleMutations } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import {
  SCHEDULE_FREQUENCY_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  PPE_TYPE_LABELS,
} from "@/constants/enum-labels";
import { formatDate, formatDateTime } from "@/utils";
import {
  IconCalendar,
  IconClock,
  IconUsers,
  IconShield,
} from "@tabler/icons-react-native";

export default function PPEScheduleDetailsScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <Inner />
    </PrivilegeGate>
  );
}

function Inner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const [refreshing, setRefreshing] = useState(false);

  const { deleteAsync } = usePpeDeliveryScheduleMutations();
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDeliverySchedule(id || "", {
    include: {
      items: { include: { item: true } },
    },
    enabled: !!id && id !== "",
  });

  const schedule = response?.data;

  useScreenReady(!isLoading);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEdit = () =>
    nav.push(mobileRoute(routes.inventory.ppe.schedules.edit(id ?? "")));

  const handleDelete = () => {
    Alert.alert(
      "Excluir Agendamento",
      "Tem certeza que deseja excluir este agendamento de EPI?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            try {
              await deleteAsync(id);
              nav.goBack({ fallback: mobileRoute(routes.inventory.ppe.schedules.root) });
            } catch {
              // api-client surfaces the error toast
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return null;
  }

  if (error || !schedule) {
    return <ErrorScreen message="Erro ao carregar agendamento" onRetry={handleRefresh} />;
  }

  return (
    <ThemedView style={styles.root}>
      <PageHeader
        title="Detalhes do Agendamento"
        variant="detail"
        actions={[
          { key: "edit", label: "Editar", onPress: handleEdit },
          {
            key: "delete",
            label: "Excluir",
            onPress: handleDelete,
            variant: "destructive",
          },
        ]}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações do Agendamento</ThemedText>
              </View>
            </View>
            <View style={styles.contentBlock}>
              {schedule.name ? (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Nome</ThemedText>
                  <ThemedText style={styles.value}>{schedule.name}</ThemedText>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <Badge variant={schedule.isActive ? "success" : "secondary"}>
                  {schedule.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Frequência</ThemedText>
                <ThemedText style={styles.value}>
                  {SCHEDULE_FREQUENCY_LABELS[schedule.frequency] ?? schedule.frequency}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Contagem</ThemedText>
                <ThemedText style={styles.value}>{schedule.frequencyCount}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Tipo de Atribuição</ThemedText>
                <ThemedText style={styles.value}>
                  {ASSIGNMENT_TYPE_LABELS[schedule.assignmentType] ?? schedule.assignmentType}
                </ThemedText>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconClock size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Datas e Horários</ThemedText>
              </View>
            </View>
            <View style={styles.contentBlock}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Criado em</ThemedText>
                <ThemedText style={styles.value}>
                  {schedule.createdAt ? formatDateTime(schedule.createdAt) : "-"}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Última Execução</ThemedText>
                <ThemedText style={styles.value}>
                  {schedule.lastRun ? formatDate(schedule.lastRun) : "Nunca"}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Próxima Execução</ThemedText>
                <ThemedText style={styles.value}>
                  {schedule.nextRun ? formatDate(schedule.nextRun) : "-"}
                </ThemedText>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconShield size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Tipos de EPI</ThemedText>
              </View>
            </View>
            <View style={styles.contentBlock}>
              {schedule.items && schedule.items.length > 0 ? (
                <View style={styles.badgeContainer}>
                  {schedule.items.map((item) => (
                    <Badge key={item.id} variant="secondary">
                      {`${item.item?.name ?? PPE_TYPE_LABELS[item.ppeType] ?? item.ppeType} (${item.quantity}x)`}
                    </Badge>
                  ))}
                </View>
              ) : (
                <ThemedText style={styles.description}>Nenhum tipo de EPI configurado</ThemedText>
              )}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconUsers size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Usuários Inclusos</ThemedText>
              </View>
            </View>
            <View style={styles.contentBlock}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Incluídos</ThemedText>
                <ThemedText style={styles.value}>
                  {schedule.includedUserIds?.length || 0} funcionário(s)
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Excluídos</ThemedText>
                <ThemedText style={styles.value}>
                  {schedule.excludedUserIds?.length || 0} funcionário(s)
                </ThemedText>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  card: { padding: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  contentBlock: { gap: spacing.sm },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    opacity: 0.6,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
