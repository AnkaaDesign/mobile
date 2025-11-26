import type { ListConfig } from '@/components/list/types'
import type { PpeDelivery } from '@/types'
import { PPE_DELIVERY_STATUS} from '@/constants'
import { routes } from '@/constants'
import { routeToMobilePath } from '@/utils/route-mapper'
import { canEditPpeDeliveries } from '@/utils/permissions/entity-permissions'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  DELIVERED: 'Entregue',
  REPROVED: 'Reprovado',
  CANCELLED: 'Cancelado',
}

export const ppeDeliveriesInventoryListConfig: ListConfig<PpeDelivery> = {
  key: 'inventory-ppe-deliveries',
  title: 'Entregas de EPI',

  query: {
    hook: 'usePpeDeliveriesInfiniteMobile',
    defaultSort: { field: 'actualDeliveryDate', direction: 'desc' },
    pageSize: 25,
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      item: {
        include: {
          category: true,
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
        key: 'user',
        label: 'FUNCIONÁRIO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (delivery) => delivery.user?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'item',
        label: 'ITEM EPI',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (delivery) => delivery.item?.name || '-',
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
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (delivery) => delivery.status || '-',
        format: 'badge',
      },
      {
        key: 'scheduledDate',
        label: 'DATA AGENDADA',
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
        width: 1.2,
        align: 'left',
        render: (delivery) => delivery.actualDeliveryDate,
        format: 'date',
      },
      {
        key: 'reviewedByUser',
        label: 'APROVADO POR',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.reviewedByUser?.name || '-',
      },
      {
        key: 'deliveryMethod',
        label: 'MÉTODO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (delivery) => delivery.deliveryMethod || '-',
      },
    ],
    defaultVisible: ['user', 'item', 'status', 'scheduledDate'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (delivery, router) => {
          router.push(routeToMobilePath(routes.inventory.ppe.deliveries.detail(delivery.id)) as any)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (delivery, router) => {
          router.push(routeToMobilePath(routes.inventory.ppe.deliveries.edit(delivery.id)) as any)
        },
        visible: (delivery) => delivery.status === PPE_DELIVERY_STATUS.PENDING || delivery.status === PPE_DELIVERY_STATUS.APPROVED,
      },
      {
        key: 'cancel',
        label: 'Cancelar',
        icon: 'x',
        variant: 'destructive',
        confirm: {
          title: 'Cancelar Entrega',
          message: 'Tem certeza que deseja cancelar esta entrega?',
          confirmText: 'Cancelar Entrega',
          cancelText: 'Voltar',
        },
        onPress: async (delivery, _router, { updateEntity }) => {
          await updateEntity(delivery.id, { status: PPE_DELIVERY_STATUS.CANCELLED })
        },
        visible: (delivery) => delivery.status === PPE_DELIVERY_STATUS.PENDING || delivery.status === PPE_DELIVERY_STATUS.APPROVED,
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
        options: [
          { label: STATUS_LABELS.PENDING, value: PPE_DELIVERY_STATUS.PENDING },
          { label: STATUS_LABELS.APPROVED, value: PPE_DELIVERY_STATUS.APPROVED },
          { label: STATUS_LABELS.DELIVERED, value: PPE_DELIVERY_STATUS.DELIVERED },
          { label: STATUS_LABELS.REPROVED, value: PPE_DELIVERY_STATUS.REPROVED },
          { label: STATUS_LABELS.CANCELLED, value: PPE_DELIVERY_STATUS.CANCELLED },
        ],
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
        placeholder: 'Selecione os itens EPI',
      },
      {
        key: 'scheduledDateRange',
        label: 'Data Agendada',
        type: 'date-range',
        placeholder: 'Data Agendada',
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
    placeholder: 'Buscar entregas de EPI...',
    debounce: 300,
  },

  export: {
    title: 'Exportar Entregas de EPI',
    filename: 'entregas-epi',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user.name', label: 'Funcionário' },
      { key: 'item.name', label: 'Item EPI' },
      { key: 'quantity', label: 'Quantidade' },
      { key: 'status', label: 'Status' },
      { key: 'scheduledDate', label: 'Data Agendada' },
      { key: 'actualDeliveryDate', label: 'Data de Entrega' },
      { key: 'reviewedByUser.name', label: 'Aprovado Por' },
      { key: 'deliveryMethod', label: 'Método de Entrega' },
      { key: 'createdAt', label: 'Data de Criação' },
    ],
  },

  actions: {
    create: {
      label: 'Registrar Entrega',
      route: routeToMobilePath(routes.inventory.ppe.deliveries.create),
      canCreate: canEditPpeDeliveries,
    },
    bulk: [
      {
        key: 'approve',
        label: 'Aprovar Selecionadas',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Aprovar Entregas',
          message: 'Deseja aprovar as entregas selecionadas?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, { status: PPE_DELIVERY_STATUS.APPROVED })
        },
      },
      {
        key: 'deliver',
        label: 'Marcar como Entregue',
        icon: 'package',
        variant: 'default',
        confirm: {
          title: 'Marcar como Entregue',
          message: 'Deseja marcar as entregas selecionadas como entregues?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, {
            status: PPE_DELIVERY_STATUS.DELIVERED,
            actualDeliveryDate: new Date(),
          })
        },
      },
      {
        key: 'cancel',
        label: 'Cancelar Selecionadas',
        icon: 'x',
        variant: 'destructive',
        confirm: {
          title: 'Cancelar Entregas',
          message: 'Deseja cancelar as entregas selecionadas?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, { status: PPE_DELIVERY_STATUS.CANCELLED })
        },
      },
    ],
  },
}
