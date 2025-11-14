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
    defaultSort: { field: 'scheduledDate', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
      item: true,
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
        render: (delivery) => delivery.status,
        format: 'badge',
      },
      {
        key: 'scheduledDate',
        label: 'DATA AGENDADA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (delivery) => delivery.scheduledDate,
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
    defaultVisible: ['user', 'item', 'status', 'scheduledDate'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
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
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'package',
        collapsible: true,
        defaultOpen: true,
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
        ],
      },
      {
        key: 'entities',
        label: 'Relacionamentos',
        icon: 'link',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'userIds',
            label: 'Funcionários',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os funcionários',
          },
          {
            key: 'itemIds',
            label: 'Itens EPI',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os itens',
          },
        ],
      },
      {
        key: 'dates',
        label: 'Datas',
        icon: 'calendar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'scheduledDate',
            label: 'Data Agendada',
            type: 'date-range',
          },
          {
            key: 'actualDeliveryDate',
            label: 'Data de Entrega',
            type: 'date-range',
          },
        ],
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
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'item', label: 'Item EPI', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'scheduledDate', label: 'Data Agendada', path: 'scheduledDate', format: 'date' },
      { key: 'actualDeliveryDate', label: 'Data Entrega', path: 'actualDeliveryDate', format: 'date' },
      { key: 'reviewedBy', label: 'Aprovado Por', path: 'reviewedByUser.name' },
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
