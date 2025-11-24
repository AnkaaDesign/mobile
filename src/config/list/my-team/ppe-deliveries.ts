import type { ListConfig } from '@/components/list/types'
import type { PpeDelivery } from '@/types'
import { PPE_DELIVERY_STATUS } from '@/constants/enums'
import { PPE_DELIVERY_STATUS_LABELS } from '@/constants/enum-labels'


export const myTeamPpeDeliveriesListConfig: ListConfig<PpeDelivery> = {
  key: 'my-team-ppe-deliveries',
  title: 'Entregas de EPI - Minha Equipe',

  query: {
    hook: 'usePpeDeliveriesInfiniteMobile',
    defaultSort: { field: 'scheduledDate', direction: 'desc' },
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
        render: (delivery) => PPE_DELIVERY_STATUS_LABELS[delivery.status] || delivery.status,
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
    ],
    defaultVisible: ['user', 'item', 'status'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'status',
        type: 'select',
        multiple: true,
        options: Object.values(PPE_DELIVERY_STATUS).map((status) => ({
          label: PPE_DELIVERY_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Status',
      },
      {
        key: 'userIds',
        type: 'select',
        multiple: true,
        placeholder: 'Funcionários',
      },
      {
        key: 'itemIds',
        type: 'select',
        multiple: true,
        placeholder: 'Itens EPI',
      },
      {
        key: 'scheduledDate',
        type: 'date-range',
        placeholder: 'Data Agendada',
      },
      {
        key: 'actualDeliveryDate',
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
    title: 'Entregas de EPI - Minha Equipe',
    filename: 'entregas-epi-minha-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'item', label: 'Item EPI', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity' },
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => PPE_DELIVERY_STATUS_LABELS[value as PPE_DELIVERY_STATUS] || value,
      },
      { key: 'scheduledDate', label: 'Data Agendada', path: 'scheduledDate', format: 'date' },
      { key: 'actualDeliveryDate', label: 'Data Entrega', path: 'actualDeliveryDate', format: 'date' },
      { key: 'reviewedBy', label: 'Aprovado Por', path: 'reviewedByUser.name' },
    ],
  },

  emptyState: {
    icon: 'package',
    title: 'Nenhuma entrega encontrada',
    description: 'Não há entregas de EPIs registradas para sua equipe',
  },

  // No create/bulk actions for team view - read-only
  actions: undefined,
}
