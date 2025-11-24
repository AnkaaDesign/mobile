import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTaskDetail } from "@/hooks";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils";
import {
  IconActivity,
  IconHistory,
} from "@tabler/icons-react-native";
import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS } from "@/constants";

export default function ActivityDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useTaskDetail(id, {
    include: {
      sector: true,
      customer: true,
      createdBy: true,
    },
    enabled: !!id && id !== "",
  });

  const task = response?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da atividade..." />;
  }

  if (error || !task || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconActivity size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Atividade não encontrada
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                A atividade solicitada não foi encontrada ou pode ter sido removida.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Activity Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <IconActivity size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={StyleSheet.flatten([styles.activityTitle, { color: colors.foreground }])}>
                  {task.name}
                </ThemedText>
                {task.serialNumber && (
                  <ThemedText style={StyleSheet.flatten([styles.activitySubtitle, { color: colors.mutedForeground }])}>
                    Nº Série: {task.serialNumber}
                  </ThemedText>
                )}
              </View>
            </View>
            <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'warning' : 'default'}>
              {TASK_STATUS_LABELS[task.status] || task.status}
            </Badge>
          </View>
        </Card>

        {/* Activity Info Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.title}>Informações da Atividade</ThemedText>
          </View>
          <View style={styles.content}>
            {task.customer && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Cliente
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {task.customer.name}
                </ThemedText>
              </View>
            )}
            {task.sector && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Setor
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {task.sector.name}
                </ThemedText>
              </View>
            )}
            {task.details && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Detalhes
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {task.details}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Dates Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.title}>Datas</ThemedText>
          </View>
          <View style={styles.content}>
            {task.entryDate && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Entrada
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formatDate(task.entryDate)}
                </ThemedText>
              </View>
            )}
            {task.term && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Prazo
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formatDate(task.term)}
                </ThemedText>
              </View>
            )}
            {task.startedAt && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Iniciado em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formatDate(task.startedAt)}
                </ThemedText>
              </View>
            )}
            {task.finishedAt && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Finalizado em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formatDate(task.finishedAt)}
                </ThemedText>
              </View>
            )}
            {task.createdAt && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Criado em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formatDate(task.createdAt)}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.TASK}
              entityId={task.id}
              entityName={task.name}
              entityCreatedAt={task.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
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
  content: {
    gap: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  activityTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  activitySubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs / 2,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    width: 120,
  },
  detailValue: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
