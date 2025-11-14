import type { ListConfig } from '@/components/list/types'
import type { ExternalWithdrawal } from '@/types'
import { EXTERNAL_WITHDRAWAL_STATUS } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PARTIALLY_RETURNED: 'Parcialmente Devolvido',
  FULLY_RETURNED: 'Totalmente Devolvido',
  CHARGED: 'Cobrado',
  CANCELLED: 'Cancelado',
}

export const externalWithdrawalsListConfig: ListConfig<ExternalWithdrawal> = {
  key: 'inventory-external-withdrawals',
  title: 'Retiradas Externas',

  query: {
    hook: 'useExternalWithdrawalsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      items: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'withdrawerName',
        label: 'RETIRADOR',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (withdrawal) => withdrawal.withdrawerName,
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (withdrawal) => withdrawal.status,
        format: 'badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (withdrawal) => {
          const typeLabels = {
            RETURNABLE: 'Devolutivo',
            CHARGEABLE: 'Cobrável',
            COURTESY: 'Cortesia',
          }
          return typeLabels[withdrawal.type as keyof typeof typeLabels] || withdrawal.type
        },
        format: 'badge',
      },
      {
        key: 'itemsCount',
        label: 'ITENS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (withdrawal) => (withdrawal as any)._count?.items || withdrawal.items?.length || 0,
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'DATA RETIRADA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (withdrawal) => withdrawal.createdAt,
        format: 'date',
      },
      {
        key: 'notes',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (withdrawal) => withdrawal.notes || '-',
      },
    ],
    defaultVisible: ['withdrawerName', 'status', 'type', 'itemsCount'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (withdrawal, router) => {
          router.push(`/estoque/retiradas-externas/detalhes/${withdrawal.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        visible: (withdrawal) => withdrawal.status === 'PENDING',
        onPress: (withdrawal, router) => {
          router.push(`/estoque/retiradas-externas/editar/${withdrawal.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (withdrawal) => `Deseja excluir a retirada de "${withdrawal.withdrawerName}"?`,
        },
        onPress: async (withdrawal, _, { delete: deleteWithdrawal }) => {
          await deleteWithdrawal(withdrawal.id)
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
            label: 'Status da Retirada',
            type: 'select',
            multiple: true,
            options: Object.values(EXTERNAL_WITHDRAWAL_STATUS).map((status) => ({
              label: STATUS_LABELS[status] || status,
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'type',
        label: 'Tipo',
        icon: 'tag',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'type',
            label: 'Tipo de Retirada',
            type: 'select',
            multiple: true,
            options: [
              { label: 'Devolutivo', value: 'RETURNABLE' },
              { label: 'Cobrável', value: 'CHARGEABLE' },
              { label: 'Cortesia', value: 'COURTESY' },
            ],
            placeholder: 'Selecione os tipos',
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
            key: 'createdAt',
            label: 'Data de Retirada',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar retiradas...',
    debounce: 300,
  },

  export: {
    title: 'Retiradas Externas',
    filename: 'retiradas-externas',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'withdrawerName', label: 'Retirador', path: 'withdrawerName' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type' },
      { key: 'itemsCount', label: 'Itens', path: '_count.items' },
      { key: 'createdAt', label: 'Data Retirada', path: 'createdAt', format: 'date' },
      { key: 'notes', label: 'Observações', path: 'notes' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Retirada',
      route: '/estoque/retiradas-externas/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'retirada' : 'retiradas'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
