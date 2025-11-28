import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMaintenance } from '@/hooks';
import { ThemedView, ThemedText, Card, ErrorScreen, Button, Badge } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatDate, formatDateTime } from '@/utils';
import { MAINTENANCE_STATUS, MAINTENANCE_STATUS_LABELS, SCHEDULE_FREQUENCY_LABELS } from '@/constants';
import { useState, useCallback } from 'react';
import { IconCalendar, IconAlertCircle, IconClock } from '@tabler/icons-react-native';
import { spacing, fontSize } from '@/constants/design-system';

export default function MaintenanceScheduleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: schedule, isLoading, error, refetch } = useMaintenance(id, {
    include: {
      item: true,
      lastRunSchedule: true,
      triggeredSchedules: true,
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando agendamento...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !schedule) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar agendamento"
          detail={error?.message || 'Agendamento não encontrado'}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Card - Schedule Info */}
        <Card style={styles.card}>
          <View style={[styles.headerRow, { paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.titleText}>
                {schedule.item?.name || 'Agendamento de Manutenção'}
              </ThemedText>
            </View>
            <Badge
              variant={
                schedule.status === 'FINISHED' ? 'success' :
                schedule.status === 'PENDING' ? 'warning' :
                'default'
              }
            >
              {MAINTENANCE_STATUS_LABELS[schedule.status] || schedule.status}
            </Badge>
          </View>

          <View style={styles.content}>
            {/* Schedule Details Section */}
            <View style={styles.section}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconCalendar size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Detalhes do Agendamento</ThemedText>
                </View>
              </View>

              <View style={styles.content}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Frequência:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {schedule.frequency ? SCHEDULE_FREQUENCY_LABELS[schedule.frequency] : '-'}
                  </ThemedText>
                </View>

                {schedule.frequencyCount && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Intervalo:</ThemedText>
                    <ThemedText style={styles.infoValue}>A cada {schedule.frequencyCount}</ThemedText>
                  </View>
                )}

                {schedule.lastRun && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Última Execução:</ThemedText>
                    <ThemedText style={styles.infoValue}>{formatDate(schedule.lastRun)}</ThemedText>
                  </View>
                )}

                {schedule.nextRun && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Próxima Execução:</ThemedText>
                    <ThemedText style={styles.infoValue}>{formatDate(schedule.nextRun)}</ThemedText>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Criado em:</ThemedText>
                  <ThemedText style={styles.infoValue}>{formatDateTime(schedule.createdAt)}</ThemedText>
                </View>
              </View>
            </View>

            {/* Executions Section */}
            {schedule.triggeredSchedules && schedule.triggeredSchedules.length > 0 && (
              <View style={styles.section}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <View style={styles.headerLeft}>
                    <IconClock size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.title}>Execuções</ThemedText>
                  </View>
                </View>

                <View style={styles.content}>
                  {schedule.triggeredSchedules.map((execution, index) => (
                    <View
                      key={index}
                      style={[
                        styles.executionItem,
                        { backgroundColor: colors.muted }
                      ]}
                    >
                      <View style={styles.executionRow}>
                        <ThemedText style={styles.executionLabel}>Execução {index + 1}</ThemedText>
                        <ThemedText style={styles.executionDate}>
                          {execution.createdAt ? formatDateTime(execution.createdAt) : '-'}
                        </ThemedText>
                      </View>
                      <View style={styles.executionRow}>
                        <ThemedText style={styles.executionStatus}>Status:</ThemedText>
                        <Badge variant={execution.status === 'FINISHED' ? 'success' : 'default'} size="sm">
                          {MAINTENANCE_STATUS_LABELS[execution.status] || execution.status}
                        </Badge>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(!schedule.triggeredSchedules || schedule.triggeredSchedules.length === 0) && (
              <View style={styles.emptyState}>
                <IconAlertCircle size={48} color={colors.mutedForeground} />
                <ThemedText style={styles.emptyText}>Nenhuma execução realizada</ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.push(`/(tabs)/estoque/manutencao/agendamentos/editar/${id}` as any)}
            style={styles.actionButton}
          >
            Editar Agendamento
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: spacing.md,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
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
  section: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  executionItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  executionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  executionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  executionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  executionStatus: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    opacity: 0.7,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
