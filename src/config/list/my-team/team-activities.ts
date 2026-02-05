import type { ListConfig } from '@/components/list/types'
import type { Activity } from '@/types'
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from '@/constants/enums'
import { ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '@/constants/enum-labels'

export const teamActivitiesListConfig: ListConfig<Activity> = {
  key: 'my-team-activities',
  title: 'Atividades da Equipe',

  query: {
    hook: 'useActivitiesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 20,
    select: {
      id: true,
      quantity: true,
      operation: true,
      reason: true,
      reasonOrder: true,
      createdAt: true,
      userId: true,
      itemId: true,
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          position: {
            select: {
              id: true,
              name: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (activity) => activity.item?.uniCode || '-',
      },
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: true,
        width: 2.5,
        align: 'left',
        render: (activity) => activity.item?.name || 'Item não encontrado',
        style: { fontWeight: '500' },
      },
      {
        key: 'operation',
        label: 'OPERAÇÃO',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (activity) => ACTIVITY_OPERATION_LABELS[activity.operation] || activity.operation,
        format: 'badge',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (activity) => activity.quantity || '-',
        format: 'number',
      },
      {
        key: 'user.name',
        label: 'USUÁRIO',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (activity) => activity.user?.name || 'Sistema',
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (activity) => activity.reason ? ACTIVITY_REASON_LABELS[activity.reason] : '-',
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (activity) => activity.createdAt || '-',
        format: 'datetime',
      },
    ],
    defaultVisible: ['item.name', 'operation', 'quantity'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'operations',
        label: 'Tipo de Operação',
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_OPERATION).map((operation) => ({
          label: ACTIVITY_OPERATION_LABELS[operation],
          value: operation,
        })),
        placeholder: 'Selecione os tipos de operação',
      },
      {
        key: 'reasons',
        label: 'Motivo da Movimentação',
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_REASON).map((reason) => ({
          label: ACTIVITY_REASON_LABELS[reason],
          value: reason,
        })),
        placeholder: 'Selecione os motivos',
      },
      {
        key: 'itemIds',
        label: 'Produtos',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['items', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getItems } = await import('@/api-client')
            const pageSize = 20
            const response = await getItems({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((item: any) => ({
                label: `${item.name} (${item.uniCode || '-'})`,
                value: item.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Item Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os produtos',
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
        key: 'quantityRange',
        label: 'Quantidade',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
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
    placeholder: 'Buscar atividades...',
    debounce: 500,
  },

  export: {
    title: 'Atividades da Equipe',
    filename: 'atividades-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'operation', label: 'Operação', path: 'operation', format: (value) => ACTIVITY_OPERATION_LABELS[value as ACTIVITY_OPERATION] || value },
      { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'reason', label: 'Motivo', path: 'reason', format: (value) => value ? ACTIVITY_REASON_LABELS[value as ACTIVITY_REASON] : '-' },
      { key: 'user', label: 'Usuário', path: 'user.name' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'datetime' },
    ],
  },

  // No create/edit/delete - activities are read-only from team perspective
  actions: undefined,
}
