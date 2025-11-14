import type { ListConfig } from '@/components/list/types'
import type { PpeDeliverySchedule } from '@/types'
import { SCHEDULE_FREQUENCY, ASSIGNMENT_TYPE } from '@/constants/enums'

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE: 'Uma Vez',
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  TRIANNUAL: 'Quadrimestral',
  QUADRIMESTRAL: 'Quadrimestral',
  SEMI_ANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  CUSTOM: 'Personalizado',
}

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  ALL: 'Todos',
  ALL_EXCEPT: 'Todos Exceto',
  SPECIFIC: 'Específicos',
}

export const ppeSchedulesListConfig: ListConfig<PpeDeliverySchedule> = {
  key: 'hr-ppe-schedules',
  title: 'Agendamentos de EPI',

  query: {
    hook: 'usePpeSchedulesInfiniteMobile',
    defaultSort: { field: 'nextRun', direction: 'asc' },
    pageSize: 25,
    include: {
      deliveries: true,
      autoOrders: true,
    },
  },

  table: {
    columns: [
      {
        key: 'frequency',
        label: 'FREQUÊNCIA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.frequency,
        format: 'badge',
        style: { fontWeight: '500' },
      },
      {
        key: 'assignmentType',
        label: 'ATRIBUIÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => ASSIGNMENT_TYPE_LABELS[schedule.assignmentType] || schedule.assignmentType,
      },
      {
        key: 'ppeItems',
        label: 'ITENS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (schedule) => schedule.ppeItems?.length || 0,
      },
      {
        key: 'isActive',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (schedule) => (schedule.isActive ? 'ACTIVE' : 'INACTIVE'),
        format: 'badge',
      },
      {
        key: 'nextRun',
        label: 'PRÓXIMA EXECUÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.nextRun,
        format: 'datetime',
      },
      {
        key: 'lastRun',
        label: 'ÚLTIMA EXECUÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.lastRun,
        format: 'datetime',
      },
      {
        key: 'deliveriesCount',
        label: 'ENTREGAS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (schedule) => schedule.deliveries?.length || 0,
      },
    ],
    defaultVisible: ['frequency', 'assignmentType', 'isActive', 'nextRun'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(`/recursos-humanos/epi/agendamentos/detalhes/${schedule.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(`/recursos-humanos/epi/agendamentos/editar/${schedule.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir este agendamento?`,
        },
        onPress: async (schedule, _, { delete: deleteSchedule }) => {
          await deleteSchedule(schedule.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'calendar-check',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'isActive',
            label: 'Ativo',
            type: 'toggle',
          },
        ],
      },
      {
        key: 'frequency',
        label: 'Frequência',
        icon: 'repeat',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'frequency',
            label: 'Frequência',
            type: 'select',
            multiple: true,
            options: Object.values(SCHEDULE_FREQUENCY).map((frequency) => ({
              label: FREQUENCY_LABELS[frequency],
              value: frequency,
            })),
            placeholder: 'Selecione as frequências',
          },
        ],
      },
      {
        key: 'assignment',
        label: 'Atribuição',
        icon: 'users',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'assignmentType',
            label: 'Tipo de Atribuição',
            type: 'select',
            multiple: true,
            options: Object.values(ASSIGNMENT_TYPE).map((type) => ({
              label: ASSIGNMENT_TYPE_LABELS[type],
              value: type,
            })),
            placeholder: 'Selecione os tipos',
          },
        ],
      },
      {
        key: 'dates',
        label: 'Datas',
        icon: 'calendar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'nextRun',
            label: 'Próxima Execução',
            type: 'date-range',
          },
          {
            key: 'lastRun',
            label: 'Última Execução',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar agendamentos...',
    debounce: 300,
  },

  export: {
    title: 'Agendamentos de EPI',
    filename: 'agendamentos-epi',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'frequency', label: 'Frequência', path: 'frequency', format: (value) => FREQUENCY_LABELS[value] || value },
      { key: 'assignmentType', label: 'Atribuição', path: 'assignmentType', format: (value) => ASSIGNMENT_TYPE_LABELS[value] || value },
      { key: 'isActive', label: 'Ativo', path: 'isActive', format: (value) => (value ? 'Sim' : 'Não') },
      { key: 'nextRun', label: 'Próxima Execução', path: 'nextRun', format: 'datetime' },
      { key: 'lastRun', label: 'Última Execução', path: 'lastRun', format: 'datetime' },
      { key: 'frequencyCount', label: 'Intervalo', path: 'frequencyCount' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Agendamento',
      route: '/recursos-humanos/epi/agendamentos/cadastrar',
    },
    bulk: [
      {
        key: 'activate',
        label: 'Ativar',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Ativação',
          message: (count) => `Ativar ${count} ${count === 1 ? 'agendamento' : 'agendamentos'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), isActive: true })
        },
      },
      {
        key: 'deactivate',
        label: 'Desativar',
        icon: 'x',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Desativação',
          message: (count) => `Desativar ${count} ${count === 1 ? 'agendamento' : 'agendamentos'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), isActive: false })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'agendamento' : 'agendamentos'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
