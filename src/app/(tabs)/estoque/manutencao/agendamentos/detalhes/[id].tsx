import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useMaintenance } from '@/hooks';
import { ThemedText, Card, Badge } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { mobileRoute } from '@/constants/routes.types';
import { formatDate, formatDateTime } from '@/utils';
import {
  MAINTENANCE_STATUS_LABELS,
  SCHEDULE_FREQUENCY_LABELS,
  SECTOR_PRIVILEGES,
  routes,
} from '@/constants';
import { IconCalendar, IconAlertCircle, IconClock } from '@tabler/icons-react-native';
import { spacing, fontSize } from '@/constants/design-system';
import { DetailScreen } from '@/components/screens/detail-screen';

export default function MaintenanceScheduleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useMaintenance(id, {
    include: {
      item: true,
      lastRunSchedule: true,
      triggeredSchedules: true,
    },
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconCalendar}
      title={(s: any) => s.item?.name ?? 'Agendamento de Manutenção'}
      privilege={{
        any: [
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.MAINTENANCE,
          SECTOR_PRIVILEGES.ADMIN,
        ],
      }}
      editRoute={(s: any) => mobileRoute(routes.inventory.maintenance.schedules.edit(s.id))}
      notFoundFallback={mobileRoute(routes.inventory.maintenance.schedules.root)}
      status={(s: any) => ({
        label:
          MAINTENANCE_STATUS_LABELS[s.status as keyof typeof MAINTENANCE_STATUS_LABELS] ?? s.status,
        variant:
          s.status === 'FINISHED' ? 'success' : s.status === 'PENDING' ? 'warning' : 'default',
      })}
    >
      {(schedule: any) => <ScheduleBody schedule={schedule} />}
    </DetailScreen>
  );
}

function ScheduleBody({ schedule }: { schedule: any }) {
  const { colors } = useTheme();

  return (
    <View style={styles.body}>
      <Card style={styles.card}>
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
              {schedule.frequency
                ? SCHEDULE_FREQUENCY_LABELS[
                    schedule.frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS
                  ]
                : '-'}
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
      </Card>

      {schedule.triggeredSchedules && schedule.triggeredSchedules.length > 0 ? (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClock size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Execuções</ThemedText>
            </View>
          </View>

          <View style={styles.content}>
            {schedule.triggeredSchedules.map((execution: any, index: number) => (
              <View
                key={index}
                style={[styles.executionItem, { backgroundColor: colors.muted }]}
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
                    {MAINTENANCE_STATUS_LABELS[
                      execution.status as keyof typeof MAINTENANCE_STATUS_LABELS
                    ] || execution.status}
                  </Badge>
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <View style={styles.emptyState}>
          <IconAlertCircle size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.emptyText}>Nenhuma execução realizada</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  content: {
    gap: spacing.sm,
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
});
