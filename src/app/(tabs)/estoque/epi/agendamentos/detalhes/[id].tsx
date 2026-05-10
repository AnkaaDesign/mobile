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
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
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

  // TODO: Wire to real `usePpeSchedule` hook when available.
  const schedule: any = { id, status: "ACTIVE" };
  const isLoading = false;
  const error: unknown = null;

  useScreenReady(!isLoading);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

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
          onPress: () => {
            // TODO: Implement delete
            nav.goBack({ fallback: mobileRoute(routes.inventory.ppe.schedules.root) });
          },
        },
      ],
    );
  };

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
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <Badge variant="success">Ativo</Badge>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Frequência</ThemedText>
                <ThemedText style={styles.value}>Mensal</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Contagem</ThemedText>
                <ThemedText style={styles.value}>1</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Tipo de Atribuição</ThemedText>
                <ThemedText style={styles.value}>Individual</ThemedText>
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
                <ThemedText style={styles.value}>{formatDateTime(new Date())}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Última Execução</ThemedText>
                <ThemedText style={styles.value}>{formatDate(new Date())}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Próxima Execução</ThemedText>
                <ThemedText style={styles.value}>{formatDate(new Date())}</ThemedText>
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
              <View style={styles.badgeContainer}>
                <Badge variant="secondary">Capacete (1x)</Badge>
                <Badge variant="secondary">Luvas (2x)</Badge>
              </View>
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
              <ThemedText style={styles.description}>Nenhum usuário específico</ThemedText>
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
