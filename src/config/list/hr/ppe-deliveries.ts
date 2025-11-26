import type { ListConfig } from '@/components/list/types'
import type { PpeDelivery } from '@/types'
import { PPE_DELIVERY_STATUS } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  DELIVERED: 'Entregue',
  REPROVED: 'Reprovado',
  CANCELLED: 'Cancelado',
}

export const ppeDeliveriesListConfig: ListConfig<PpeDelivery> = {
  key: 'hr-ppe-deliveries',
  title: 'Entregas de EPI',

  query: {
    hook: 'usePpeDeliveriesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
      item: {
        include: {
          brand: true,
        },
      },
      reviewedByUser: true,
      ppeSchedule: true,
    },
  },

  table: {
    columns: [
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (delivery) => delivery.item?.uniCode || '-',
      },
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (delivery) => delivery.item?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'item.brand.name',
        label: 'MARCA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (delivery) => delivery.item?.brand?.name || '-',
      },
      {
        key: 'user.name',
        label: 'USUÁRIO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (delivery) => delivery.user?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (delivery) => STATUS_LABELS[delivery.status] || delivery.status,
        format: 'badge',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (delivery) => delivery.quantity.toString(),
      },
      {
        key: 'createdAt',
        label: 'DATA DE REQUISIÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.createdAt,
        format: 'datetime',
      },
      {
        key: 'scheduledDate',
        label: 'DATA PROGRAMADA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (delivery) => delivery.scheduledDate || '-',
        format: 'date',
      },
      {
        key: 'actualDeliveryDate',
        label: 'DATA ENTREGA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.actualDeliveryDate,
        format: 'datetime',
      },
      {
        key: 'reviewedByUser.name',
        label: 'APROVADO POR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.reviewedByUser?.name || '-',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['item.name', 'user.name', 'status'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (delivery, router) => {
          router.push(`/recursos-humanos/epi/entregas/detalhes/${delivery.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (delivery, router) => {
          router.push(`/recursos-humanos/epi/entregas/editar/${delivery.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (delivery) =>
            `Deseja excluir a entrega de "${delivery.item?.name || 'EPI'}" para "${delivery.user?.name || 'funcionário'}"?`,
        },
        onPress: async (delivery, _, { delete: deleteDelivery }) => {
          await deleteDelivery(delivery.id)
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
        options: Object.values(PPE_DELIVERY_STATUS).map((status) => ({
          label: STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'userIds',
        label: 'Funcionários',
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
        placeholder: 'Selecione os funcionários',
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
        placeholder: 'Selecione os itens',
      },
      {
        key: 'scheduledDateRange',
        label: 'Data Programada',
        type: 'date-range',
        placeholder: 'Data Programada',
      },
      {
        key: 'actualDeliveryDateRange',
        label: 'Data de Entrega',
        type: 'date-range',
        placeholder: 'Data de Entrega',
      },
    ],
  },

  search: {
    placeholder: 'Buscar entregas...',
    debounce: 300,
  },

  export: {
    title: 'Entregas de EPI',
    filename: 'entregas-epi',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'item.uniCode', label: 'Código', path: 'item.uniCode' },
      { key: 'item.name', label: 'Item', path: 'item.name' },
      { key: 'item.brand.name', label: 'Marca', path: 'item.brand.name' },
      { key: 'user.name', label: 'Usuário', path: 'user.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'quantity', label: 'Quantidade', path: 'quantity' },
      { key: 'createdAt', label: 'Data de Requisição', path: 'createdAt', format: 'datetime' },
      { key: 'scheduledDate', label: 'Data Programada', path: 'scheduledDate', format: 'date' },
      { key: 'actualDeliveryDate', label: 'Data Entrega', path: 'actualDeliveryDate', format: 'datetime' },
      { key: 'reviewedByUser.name', label: 'Aprovado Por', path: 'reviewedByUser.name' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Entrega',
      route: '/recursos-humanos/epi/entregas/cadastrar',
    },
    bulk: [
      {
        key: 'approve',
        label: 'Aprovar',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Aprovação',
          message: (count) => `Aprovar ${count} ${count === 1 ? 'entrega' : 'entregas'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'APPROVED' })
        },
      },
      {
        key: 'deliver',
        label: 'Marcar como Entregue',
        icon: 'package-check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Entrega',
          message: (count) => `Marcar ${count} ${count === 1 ? 'entrega' : 'entregas'} como entregue?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'DELIVERED', actualDeliveryDate: new Date() })
        },
      },
      {
        key: 'cancel',
        label: 'Cancelar',
        icon: 'x',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Cancelamento',
          message: (count) => `Cancelar ${count} ${count === 1 ? 'entrega' : 'entregas'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'CANCELLED' })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'entrega' : 'entregas'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
