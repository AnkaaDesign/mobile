import type { ListConfig } from '@/components/list/types'
import type { ExternalWithdrawal } from '@/types'
import { EXTERNAL_WITHDRAWAL_STATUS } from '@/constants/enums'
import { canEditExternalWithdrawals } from '@/utils/permissions/entity-permissions'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CANCELLED: 'Cancelado',
  PARTIALLY_RETURNED: 'Parcialmente Devolvido',
  FULLY_RETURNED: 'Totalmente Devolvido',
  CHARGED: 'Cobrado',
  LIQUIDATED: 'Liquidado',
  DELIVERED: 'Entregue',
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
        render: (withdrawal) => STATUS_LABELS[withdrawal.status] || withdrawal.status || '-',
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
            RETURNABLE: 'Retornável',
            CHARGEABLE: 'Cobrável',
            COMPLIMENTARY: 'Cortesia',
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
        render: (withdrawal) => String((withdrawal as any)._count?.items || withdrawal.items?.length || 0),
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'DATA RETIRADA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (withdrawal) => withdrawal.createdAt || '-',
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
    defaultVisible: ['withdrawerName', 'itemsCount', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(EXTERNAL_WITHDRAWAL_STATUS).map((status) => ({
          label: STATUS_LABELS[status] || status,
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Retornável', value: 'RETURNABLE' },
          { label: 'Cobrável', value: 'CHARGEABLE' },
          { label: 'Cortesia', value: 'COMPLIMENTARY' },
        ],
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'hasNfe',
        label: 'Com NFe',
        description: 'Apenas retiradas com nota fiscal',
        type: 'toggle',
        placeholder: 'Com NFe',
      },
      {
        key: 'hasReceipt',
        label: 'Com Recibo',
        description: 'Apenas retiradas com recibo',
        type: 'toggle',
        placeholder: 'Com Recibo',
      },
      {
        key: 'createdAt',
        label: 'Data de Retirada',
        type: 'date-range',
        placeholder: 'Data de Retirada',
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
      canCreate: canEditExternalWithdrawals,
    },
    bulk: [
      {
        key: 'edit',
        label: 'Editar em Lote',
        icon: 'pencil',
        variant: 'default',
        onPress: async (ids, _, router) => {
          const idsArray = Array.from(ids)
          router.push(`/estoque/retiradas-externas/editar-em-lote?ids=${idsArray.join(',')}`)
        },
      },
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
