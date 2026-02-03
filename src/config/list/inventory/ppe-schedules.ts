import type { ListConfig } from '@/components/list/types'
import type { PpeDeliverySchedule } from '@/types'
import { SCHEDULE_FREQUENCY, ASSIGNMENT_TYPE } from '@/constants/enums'
import { routes } from '@/constants'
import { routeToMobilePath } from '@/utils/route-mapper'
import { canEditPpeDeliveries } from '@/utils/permissions/entity-permissions'

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

export const ppeSchedulesInventoryListConfig: ListConfig<PpeDeliverySchedule> = {
  key: 'inventory-ppe-schedules',
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
        render: (schedule) => FREQUENCY_LABELS[schedule.frequency] || schedule.frequency,
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
        render: (schedule) => String(schedule.ppeItems?.length || 0),
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
      {
        key: 'deliveriesCount',
        label: 'ENTREGAS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (schedule) => String(schedule.deliveries?.length || 0),
      },
      {
        key: 'rescheduleCount',
        label: 'REAGENDAMENTOS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (schedule) => String(schedule.rescheduleCount || 0),
      },
    ],
    defaultVisible: ['frequency', 'assignmentType', 'ppeItems', 'isActive'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(routeToMobilePath(routes.inventory.ppe.schedules.detail(schedule.id)) as any)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (schedule, router) => {
          router.push(routeToMobilePath(routes.inventory.ppe.schedules.edit(schedule.id)) as any)
        },
      },
      {
        key: 'toggle',
        label: (schedule) => (schedule.isActive ? 'Desativar' : 'Ativar'),
        icon: (schedule) => (schedule.isActive ? 'x' : 'check'),
        variant: (schedule) => (schedule.isActive ? 'destructive' : 'default'),
        confirm: (schedule) => ({
          title: schedule.isActive ? 'Desativar Agendamento' : 'Ativar Agendamento',
          message: `Tem certeza que deseja ${schedule.isActive ? 'desativar' : 'ativar'} este agendamento?`,
          confirmText: schedule.isActive ? 'Desativar' : 'Ativar',
          cancelText: 'Cancelar',
        }),
        onPress: async (schedule, _router, { updateEntity }) => {
          await updateEntity(schedule.id, { isActive: !schedule.isActive })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Excluir Agendamento',
          message: 'Tem certeza que deseja excluir este agendamento?',
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
        },
        onPress: async (schedule, _router, { deleteEntity }) => {
          await deleteEntity(schedule.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Ativo', value: 'true' },
          { label: 'Inativo', value: 'false' },
        ],
        placeholder: 'Selecione os status',
      },
      {
        key: 'itemIds',
        label: 'Itens EPI',
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
        placeholder: 'Selecione os itens EPI',
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
        options: [
          { label: FREQUENCY_LABELS.ONCE, value: SCHEDULE_FREQUENCY.ONCE },
          { label: FREQUENCY_LABELS.DAILY, value: SCHEDULE_FREQUENCY.DAILY },
          { label: FREQUENCY_LABELS.WEEKLY, value: SCHEDULE_FREQUENCY.WEEKLY },
          { label: FREQUENCY_LABELS.BIWEEKLY, value: SCHEDULE_FREQUENCY.BIWEEKLY },
          { label: FREQUENCY_LABELS.MONTHLY, value: SCHEDULE_FREQUENCY.MONTHLY },
          { label: FREQUENCY_LABELS.BIMONTHLY, value: SCHEDULE_FREQUENCY.BIMONTHLY },
          { label: FREQUENCY_LABELS.QUARTERLY, value: SCHEDULE_FREQUENCY.QUARTERLY },
          { label: FREQUENCY_LABELS.SEMI_ANNUAL, value: SCHEDULE_FREQUENCY.SEMI_ANNUAL },
          { label: FREQUENCY_LABELS.ANNUAL, value: SCHEDULE_FREQUENCY.ANNUAL },
        ],
        placeholder: 'Selecione as frequências',
      },
      {
        key: 'assignmentType',
        label: 'Tipo de Atribuição',
        type: 'select',
        multiple: true,
        options: [
          { label: ASSIGNMENT_TYPE_LABELS.ALL, value: ASSIGNMENT_TYPE.ALL },
          { label: ASSIGNMENT_TYPE_LABELS.ALL_EXCEPT, value: ASSIGNMENT_TYPE.ALL_EXCEPT },
          { label: ASSIGNMENT_TYPE_LABELS.SPECIFIC, value: ASSIGNMENT_TYPE.SPECIFIC },
        ],
        placeholder: 'Selecione os tipos de atribuição',
      },
      {
        key: 'nextRunRange',
        label: 'Próxima Execução',
        type: 'date-range',
        placeholder: 'Próxima Execução',
      },
      {
        key: 'lastRunRange',
        label: 'Última Execução',
        type: 'date-range',
        placeholder: 'Última Execução',
      },
    ],
  },

  search: {
    placeholder: 'Buscar agendamentos de EPI...',
    debounce: 500,
  },

  export: {
    title: 'Exportar Agendamentos de EPI',
    filename: 'agendamentos-epi',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'frequency', label: 'Frequência' },
      { key: 'assignmentType', label: 'Tipo de Atribuição' },
      { key: 'ppeItems', label: 'Quantidade de Itens' },
      { key: 'isActive', label: 'Ativo' },
      { key: 'nextRun', label: 'Próxima Execução' },
      { key: 'lastRun', label: 'Última Execução' },
      { key: 'rescheduleCount', label: 'Reagendamentos' },
      { key: 'createdAt', label: 'Data de Criação' },
    ],
  },

  actions: {
    create: {
      label: 'Criar Agendamento',
      route: routeToMobilePath(routes.inventory.ppe.schedules.create),
      canCreate: canEditPpeDeliveries,
    },
    bulk: [
      {
        key: 'activate',
        label: 'Ativar Selecionados',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Ativar Agendamentos',
          message: 'Deseja ativar os agendamentos selecionados?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, { isActive: true })
        },
      },
      {
        key: 'deactivate',
        label: 'Desativar Selecionados',
        icon: 'x',
        variant: 'destructive',
        confirm: {
          title: 'Desativar Agendamentos',
          message: 'Deseja desativar os agendamentos selecionados?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, { isActive: false })
        },
      },
      {
        key: 'delete',
        label: 'Excluir Selecionados',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Excluir Agendamentos',
          message: 'Deseja excluir permanentemente os agendamentos selecionados?',
        },
        action: async (ids, { deleteEntities }) => {
          await deleteEntities(ids)
        },
      },
    ],
  },
}
