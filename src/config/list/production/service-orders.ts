import type { ListConfig } from '@/components/list/types'
import type { ServiceOrder } from '@/types'
import { canEditServiceOrders, canDeleteTasks } from '@/utils/permissions/entity-permissions'
import { hasAnyPrivilege } from '@/utils'
import {
  SERVICE_ORDER_STATUS,
  SERVICE_ORDER_STATUS_LABELS,
  SECTOR_PRIVILEGES,
} from '@/constants'

export const serviceOrdersListConfig: ListConfig<ServiceOrder> = {
  key: 'production-service-orders',
  title: 'Ordens de Serviço',

  query: {
    hook: 'useServiceOrdersInfiniteMobile',
    mutationsHook: 'useServiceOrderMutations',
    batchMutationsHook: 'useServiceOrderBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 40,
    include: {
      task: {
        include: {
          customer: {
            select: {
              id: true,
              fantasyName: true,
              corporateName: true,
              cnpj: true,
              cpf: true,
            },
          },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: true,
        width: 2.5,
        align: 'left',
        render: (order) => order.description || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (order) => SERVICE_ORDER_STATUS_LABELS[order.status as SERVICE_ORDER_STATUS] || order.status,
        format: 'badge',
      },
      {
        key: 'task.customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (order) => order.task?.customer?.fantasyName || order.task?.customer?.corporateName || '-',
      },
      {
        key: 'service.name',
        label: 'SERVIÇO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (order) => order.service?.name || '-',
      },
      {
        key: 'startedAt',
        label: 'INICIADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (order) => order.startedAt,
        format: 'datetime',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (order) => order.finishedAt,
        format: 'datetime',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (order) => order.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['description', 'status', 'task.customer.fantasyName'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (order, router) => {
          router.push(`/producao/ordens-de-servico/detalhes/${order.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditServiceOrders,
        onPress: (order, router) => {
          router.push(`/producao/ordens-de-servico/editar/${order.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteTasks,
        confirm: {
          title: 'Confirmar Exclusão',
          message: (order) => `Deseja excluir a ordem de serviço "${order.description || order.id}"?`,
        },
        onPress: async (order, _, { delete: deleteOrder } = {}) => {
          await deleteOrder?.(order.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(SERVICE_ORDER_STATUS).map((status) => ({
          label: SERVICE_ORDER_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'taskIds',
        label: 'Tarefas',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['tasks', 'filter', 'sector-aware'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            // Use sector-aware task filter (team leaders only see their sector's tasks)
            const { fetchTasksForFilter } = await import('@/utils/task-filter')
            return fetchTasksForFilter({
              searchTerm,
              page,
              pageSize: 20,
              orderBy: { createdAt: 'desc' },
            })
          } catch (error) {
            console.error('[Task Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as tarefas',
      },
      {
        key: 'startedAt',
        label: 'Data de Início',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
      {
        key: 'finishedAt',
        label: 'Data de Conclusão',
        type: 'date-range',
        placeholder: 'Data de Conclusão',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por cliente, veículo ou descrição...',
    debounce: 500,
  },

  export: {
    title: 'Ordens de Serviço',
    filename: 'ordens-de-servico',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'customer', label: 'Cliente', path: 'task.customer.fantasyName' },
      { key: 'service', label: 'Serviço', path: 'service.name' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'datetime' },
      { key: 'finishedAt', label: 'Finalizado Em', path: 'finishedAt', format: 'datetime' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Ordem de Serviço',
      route: '/producao/ordens-de-servico/cadastrar',
      // API: POST /service-orders has no LOGISTIC (service-order.controller.ts:108-116)
      canCreate: (user: any) =>
        hasAnyPrivilege(user, [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.DESIGNER,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ]),
    },
    // Bulk "Atualizar Status" removed: bulk onPress only receives (ids, mutations) and
    // cannot render a status picker, so the placeholder sent empty updates. Re-add once
    // the list machinery supports a bulk value picker.
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'ordem' : 'ordens'} de serviço?`,
        },
        onPress: async (ids, { batchDeleteAsync } = {}) => {
          await batchDeleteAsync?.({ serviceOrderIds: Array.from(ids) })
        },
        // API: service-order batch delete = FINANCIAL+COMMERCIAL+ADMIN
        canPerform: (user) => hasAnyPrivilege(user, [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN]),
      },
    ],
  },
}
