import type { ListConfig } from '@/components/list/types'
import type { ScheduledBackupJob } from '@/api-client/backup'
import { backupApi } from '@/api-client'
import { canEditUsers } from '@/utils/permissions/entity-permissions'

// Type labels
const TYPE_LABELS: Record<string, string> = {
  database: 'Banco de Dados',
  files: 'Arquivos',
  system: 'Sistema',
  full: 'Completo',
}

export const backupSchedulesListConfig: ListConfig<ScheduledBackupJob> = {
  key: 'administration-backup-schedules',
  title: 'Agendamentos de Backup',

  query: {
    hook: 'useScheduledBackupsInfiniteMobile',
    mutationsHook: 'useBackupMutations',
    defaultSort: { field: 'name', direction: 'asc' },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (schedule) => schedule.name,
        style: { fontWeight: '600' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (schedule) => schedule.type ? (TYPE_LABELS[schedule.type] || schedule.type) : '-',
        format: 'badge',
        badgeEntity: 'BACKUP',
      },
      {
        key: 'cron',
        label: 'AGENDAMENTO',
        sortable: false,
        width: 1.8,
        align: 'left',
        render: (schedule) => backupApi.parseCronToHuman(schedule.cron),
      },
      {
        key: 'next',
        label: 'PRÓXIMA EXECUÇÃO',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (schedule) => {
          if (!schedule.next) return 'N/A'
          return new Date(schedule.next).toLocaleString('pt-BR')
        },
      },
      {
        key: 'enabled',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (schedule) => schedule.enabled !== false ? 'Ativo' : 'Inativo',
        format: 'badge',
        badgeEntity: 'BACKUP',
      },
    ],
    defaultVisible: ['name', 'cron', 'next'],
    rowHeight: 72,
    actions: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Excluir Agendamento',
          message: (schedule) => `Deseja excluir o agendamento "${schedule.name}"?`,
        },
        onPress: async (schedule, _, context) => {
          // useBackupMutations returns { removeScheduled } as a mutation object
          const removeFn = (context?.mutations as any)?.removeScheduled
          if (removeFn?.mutateAsync) {
            await removeFn.mutateAsync(schedule.id)
          } else if (typeof removeFn === 'function') {
            await removeFn(schedule.id)
          }
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Banco de Dados', value: 'database' },
          { label: 'Arquivos', value: 'files' },
          { label: 'Sistema', value: 'system' },
          { label: 'Completo', value: 'full' },
        ],
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'enabled',
        label: 'Status',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ativo', value: 'true' },
          { label: 'Inativo', value: 'false' },
        ],
        placeholder: 'Selecione',
      },
    ],
  },

  search: {
    placeholder: 'Buscar agendamentos...',
    debounce: 500,
  },

  actions: {
    create: {
      label: 'Novo Agendamento',
      route: '/servidor/backups/cadastrar-agendamento',
      canCreate: canEditUsers,
    },
  },

  emptyState: {
    icon: 'calendar-event',
    title: 'Nenhum agendamento',
    description: 'Crie um agendamento para backups automáticos',
  },
}
