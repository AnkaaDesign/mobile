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
        key: 'id',
        label: 'ID',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (schedule) => schedule.id.slice(0, 8),
        style: { fontWeight: '500' },
      },
      {
        key: 'ppeItems',
        label: 'ITENS DE EPI',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (schedule) => {
          const count = schedule.ppeItems?.length || 0
          return count > 0 ? `${count} item${count > 1 ? 'ns' : ''}` : '-'
        },
      },
      {
        key: 'assignmentType',
        label: 'ATRIBUIÇÃO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (schedule) => ASSIGNMENT_TYPE_LABELS[schedule.assignmentType] || schedule.assignmentType,
      },
      {
        key: 'frequency',
        label: 'FREQUÊNCIA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (schedule) => FREQUENCY_LABELS[schedule.frequency] || schedule.frequency,
      },
      {
        key: 'nextRun',
        label: 'PRÓXIMA EXECUÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.nextRun || '-',
        format: 'date',
      },
      {
        key: 'isActive',
        label: 'ATIVO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (schedule) => (schedule.isActive ? 'Sim' : 'Não'),
        format: 'badge',
      },
      {
        key: 'frequencyCount',
        label: 'INTERVALO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (schedule) => String(schedule.frequencyCount || '-'),
      },
      {
        key: 'lastRun',
        label: 'ÚLTIMA EXECUÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.lastRun,
        format: 'date',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (schedule) => schedule.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['ppeItems', 'frequency', 'nextRun'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
    fields: [
      {
        key: 'itemIds',
        label: 'Itens',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['ppe-items', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getItems } = await import('@/api-client')
            const pageSize = 20
            const response = await getItems({
              where: {
                ...(searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : {}),
                category: { type: 'PPE' },
              },
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[PPE Item Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os itens',
      },
      {
        key: 'userIds',
        label: 'Usuários',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((user: any) => ({
                label: user.name,
                value: user.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os usuários',
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
        key: 'isActive',
        label: 'Apenas Ativos',
        type: 'toggle',
        placeholder: 'Apenas ativos',
      },
      {
        key: 'nextRunRange',
        label: 'Próxima Execução',
        type: 'date-range',
        placeholder: 'Próxima Execução',
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
      { key: 'id', label: 'ID', path: 'id' },
      { key: 'ppeItems', label: 'Itens de EPI', path: 'ppeItems', format: (value) => value?.length || 0 },
      { key: 'assignmentType', label: 'Atribuição', path: 'assignmentType', format: (value) => ASSIGNMENT_TYPE_LABELS[value] || value },
      { key: 'frequency', label: 'Frequência', path: 'frequency', format: (value) => FREQUENCY_LABELS[value] || value },
      { key: 'nextRun', label: 'Próxima Execução', path: 'nextRun', format: 'date' },
      { key: 'isActive', label: 'Ativo', path: 'isActive', format: (value) => (value ? 'Sim' : 'Não') },
      { key: 'frequencyCount', label: 'Intervalo', path: 'frequencyCount' },
      { key: 'lastRun', label: 'Última Execução', path: 'lastRun', format: 'date' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'datetime' },
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
