import type { ListConfig } from '@/components/list/types'
import type { Task } from '@/types'
import {
  COMMISSION_STATUS,
  COMMISSION_STATUS_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
} from '@/constants'

export const teamCommissionsListConfig: ListConfig<Task> = {
  key: 'my-team-commissions',
  title: 'Comissões da Equipe',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    // Filter tasks to only show those with commission (exclude NO_COMMISSION)
    forcedParams: {
      commission: [
        COMMISSION_STATUS.FULL_COMMISSION,
        COMMISSION_STATUS.PARTIAL_COMMISSION,
        COMMISSION_STATUS.SUSPENDED_COMMISSION,
      ],
    },
    // Use optimized select patterns for better performance
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          position: {
            select: {
              id: true,
              name: true,
            }
          },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'createdBy.name',
        label: 'COLABORADOR',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (task) => task.createdBy?.name || 'Desconhecido',
        style: { fontWeight: '600' },
      },
      {
        key: 'name',
        label: 'TAREFA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (task) => task.name,
      },
      {
        key: 'serialNumber',
        label: 'Nº SÉRIE',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.serialNumber || '-',
      },
      {
        key: 'customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (task) => task.customer?.fantasyName || '-',
      },
      {
        key: 'commission',
        label: 'STATUS COMISSÃO',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (task) => task.commission,
        format: 'badge',
      },
      {
        key: 'pricing.total',
        label: 'VALOR',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (task) => task.pricing?.total || null,
        format: 'currency',
      },
      {
        key: 'status',
        label: 'STATUS TAREFA',
        sortable: true,
        width: 1.3,
        align: 'center',
        render: (task) => task.status,
        format: 'badge',
      },
      {
        key: 'createdBy.position.name',
        label: 'CARGO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (task) => task.createdBy?.position?.name || '-',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['createdBy.name', 'name', 'customer.fantasyName', 'commission', 'price', 'createdAt'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'commission',
        label: 'Status da Comissão',
        type: 'select',
        multiple: true,
        options: Object.values(COMMISSION_STATUS).map((status) => ({
          label: COMMISSION_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status da comissão',
      },
      {
        key: 'status',
        label: 'Status da Tarefa',
        type: 'select',
        multiple: true,
        options: Object.values(TASK_STATUS).map((status) => ({
          label: TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] || status,
          value: status,
        })),
        placeholder: 'Selecione os status da tarefa',
      },
      {
        key: 'createdByIds',
        label: 'Colaboradores',
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
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'customerIds',
        label: 'Clientes',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['customers', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getCustomers } = await import('@/api-client')
            const pageSize = 20
            const response = await getCustomers({
              where: searchTerm ? { fantasyName: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { fantasyName: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((customer: any) => ({
                label: customer.fantasyName,
                value: customer.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Customer Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os clientes',
      },
      {
        key: 'createdAtRange',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
      {
        key: 'priceRange',
        label: 'Preço',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
    ],
  },

  search: {
    placeholder: 'Buscar por tarefa, colaborador ou cliente...',
    debounce: 500,
  },

  export: {
    title: 'Comissões da Equipe',
    filename: 'comissoes-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'createdBy', label: 'Colaborador', path: 'createdBy.name' },
      { key: 'position', label: 'Cargo', path: 'createdBy.position.name' },
      { key: 'task', label: 'Tarefa', path: 'name' },
      { key: 'serialNumber', label: 'Número de Série', path: 'serialNumber' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      {
        key: 'commission',
        label: 'Status Comissão',
        path: 'commission',
        format: (value) => COMMISSION_STATUS_LABELS[value as COMMISSION_STATUS] || value
      },
      { key: 'price', label: 'Valor', path: 'price', format: 'currency' },
      {
        key: 'status',
        label: 'Status Tarefa',
        path: 'status',
        format: (value) => TASK_STATUS_LABELS[value as keyof typeof TASK_STATUS_LABELS] || value
      },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  // No create/edit/delete - commissions are managed through tasks
  actions: undefined,
}
