import type { ListConfig } from '@/components/list/types'
import type { OrderSchedule } from '@/types'
import { SCHEDULE_FREQUENCY } from '@/constants/enums'
import { canEditOrders } from '@/utils/permissions/entity-permissions'


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

export const orderSchedulesListConfig: ListConfig<OrderSchedule> = {
  key: 'inventory-order-schedules',
  title: 'Pedidos Automáticos',

  query: {
    hook: 'useOrderSchedulesInfiniteMobile',
    defaultSort: { field: 'nextRun', direction: 'asc' },
    pageSize: 25,
    include: {
      supplier: true,
      orders: true,
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
        render: (schedule) => FREQUENCY_LABELS[schedule.frequency] || schedule.frequency,
        style: { fontWeight: '500' },
      },
      {
        key: 'frequencyCount',
        label: 'INTERVALO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (schedule) => schedule.frequencyCount.toString(),
      },
      {
        key: 'supplier',
        label: 'FORNECEDOR',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (schedule) => schedule.supplier?.name || '-',
      },
      {
        key: 'itemsCount',
        label: 'ITENS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (schedule) => String(schedule.items?.length || 0),
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
        render: (schedule) => schedule.nextRun || '-',
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
    ],
    defaultVisible: ['frequency', 'isActive', 'nextRun'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(`/estoque/pedidos/automaticos/detalhes/${schedule.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(`/estoque/pedidos/automaticos/editar/${schedule.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir este agendamento automático?`,
        },
        onPress: async (schedule, _, { delete: deleteSchedule }) => {
          await deleteSchedule(schedule.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'isActive',
        label: 'Ativo',
        type: 'toggle',
        placeholder: 'Ativo',
      },
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
      {
        key: 'supplierIds',
        label: 'Fornecedores',
        type: 'select',
        multiple: true,
        placeholder: 'Selecione os fornecedores',
      },
      {
        key: 'nextRun',
        label: 'Próxima Execução',
        type: 'date-range',
        placeholder: 'Próxima Execução',
      },
      {
        key: 'lastRun',
        label: 'Última Execução',
        type: 'date-range',
        placeholder: 'Última Execução',
      },
    ],
  },

  search: {
    placeholder: 'Buscar agendamentos...',
    debounce: 300,
  },

  export: {
    title: 'Pedidos Automáticos',
    filename: 'pedidos-automaticos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      {
        key: 'frequency',
        label: 'Frequência',
        path: 'frequency',
        format: (value) => FREQUENCY_LABELS[value] || value,
      },
      { key: 'frequencyCount', label: 'Intervalo', path: 'frequencyCount' },
      { key: 'supplier', label: 'Fornecedor', path: 'supplier.name' },
      { key: 'isActive', label: 'Ativo', path: 'isActive', format: (value) => (value ? 'Sim' : 'Não') },
      { key: 'nextRun', label: 'Próxima Execução', path: 'nextRun', format: 'datetime' },
      { key: 'lastRun', label: 'Última Execução', path: 'lastRun', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Novo Pedido Automático',
      route: '/estoque/pedidos/automaticos/cadastrar',
      canCreate: canEditOrders,
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
