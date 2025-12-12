import type { ListConfig } from '@/components/list/types'
import type { PpeDelivery } from '@/types'
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '@/constants'


export const personalPpeDeliveriesListConfig: ListConfig<PpeDelivery> = {
  key: 'personal-ppe-deliveries',
  title: 'Meus EPIs',

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
      reviewedByUser: true,
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      ppeSchedule: true,
    },
  },

  table: {
    columns: [
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
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (delivery) => PPE_DELIVERY_STATUS_LABELS[delivery.status] || delivery.status,
        format: 'badge',
        badgeEntity: 'PPE_DELIVERY',
      },
      {
        key: 'createdAt',
        label: 'DATA REQUISIÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.createdAt,
        format: 'datetime-multiline',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (delivery) => String(delivery.quantity || 0),
        format: 'number',
      },
      {
        key: 'actualDeliveryDate',
        label: 'DATA DE ENTREGA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (delivery) => delivery.actualDeliveryDate || delivery.scheduledDate,
        format: 'date',
      },
      {
        key: 'reviewedByUser.name',
        label: 'REVISADO POR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (delivery) => delivery.reviewedByUser?.name || '-',
      },
      {
        key: 'item.ca',
        label: 'CA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (delivery) => delivery.item?.ca || '-',
      },
      {
        key: 'item.validity',
        label: 'VALIDADE',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (delivery) => delivery.item?.validity,
        format: 'date',
      },
      {
        key: 'scheduledDate',
        label: 'DATA AGENDADA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (delivery) => delivery.scheduledDate,
        format: 'date',
      },
      {
        key: 'notes',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (delivery) => delivery.notes || '-',
      },
    ],
    defaultVisible: ['item.name', 'status', 'createdAt'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(PPE_DELIVERY_STATUS).map((status) => ({
          label: PPE_DELIVERY_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'ppeTypes',
        label: 'Tipos de EPI',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['categories', 'filter', 'ppe'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getCategories } = await import('@/api-client')
            const pageSize = 20
            const response = await getCategories({
              where: {
                ...(searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : {}),
                type: 'PPE',
              },
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((category: any) => ({
                label: category.name,
                value: category.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Category Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'deliveryDateRange',
        label: 'Período de Entrega',
        type: 'date-range',
        placeholder: 'Período de Entrega',
      },
    ],
  },

  search: {
    placeholder: 'Buscar EPIs...',
    debounce: 300,
  },

  export: {
    title: 'Meus EPIs',
    filename: 'meus-epis',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'actualDeliveryDate', label: 'Data de Entrega', path: 'actualDeliveryDate', format: 'date' },
      { key: 'scheduledDate', label: 'Data Agendada', path: 'scheduledDate', format: 'date' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => PPE_DELIVERY_STATUS_LABELS[value] || value },
      { key: 'reviewedBy', label: 'Revisado Por', path: 'reviewedByUser.name' },
      { key: 'ca', label: 'CA', path: 'item.ca' },
      { key: 'validity', label: 'Validade', path: 'item.validity', format: 'date' },
      { key: 'notes', label: 'Observações', path: 'notes' },
      { key: 'createdAt', label: 'Data Requisição', path: 'createdAt', format: 'date' },
    ],
  },

  // Allow users to request PPE
  actions: {
    create: {
      label: 'Solicitar EPI',
      route: '/(tabs)/pessoal/meus-epis/request',
    },
  },

  emptyState: {
    icon: 'package',
    title: 'Nenhuma entrega de EPI encontrada',
    description: 'Você ainda não possui entregas de EPI registradas',
  },
}
