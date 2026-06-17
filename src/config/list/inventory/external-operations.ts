import type { ListConfig, ActionMutationsContext } from '@/components/list/types'
import type { ExternalOperation } from '@/types'
import { EXTERNAL_OPERATION_STATUS, EXTERNAL_OPERATION_TYPE } from '@/constants/enums'
import { EDITABLE_EXTERNAL_OPERATION_STATUSES } from '@/constants/editable-statuses'
import { canEditExternalOperations, canDeleteExternalOperations, canViewPrices } from '@/utils/permissions/entity-permissions'
import { formatCurrency } from '@/utils'

/** items + services total for a CHARGEABLE operation (0 otherwise) */
function getOperationTotal(withdrawal: ExternalOperation): number {
  if (withdrawal.type !== EXTERNAL_OPERATION_TYPE.CHARGEABLE) return 0
  const itemsTotal = (withdrawal.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.withdrawedQuantity) || 0),
    0,
  )
  const servicesTotal = (withdrawal.services || []).reduce(
    (sum, service) => sum + (Number(service.amount) || 0),
    0,
  )
  return itemsTotal + servicesTotal
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CANCELLED: 'Cancelado',
  PARTIALLY_RETURNED: 'Parcialmente Devolvido',
  FULLY_RETURNED: 'Totalmente Devolvido',
  CHARGED: 'Cobrado',
  LIQUIDATED: 'Liquidado',
  DELIVERED: 'Entregue',
}

export const externalOperationsListConfig: ListConfig<ExternalOperation> = {
  key: 'inventory-external-operations',
  title: 'Operações Externas',

  query: {
    hook: 'useExternalOperationsInfiniteMobile',
    mutationsHook: 'useExternalOperationMutations',
    batchMutationsHook: 'useExternalOperationBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      items: true,
      customer: true,
      services: true,
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
        render: (withdrawal) => withdrawal.withdrawerName || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'customer',
        label: 'CLIENTE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (withdrawal) => withdrawal.customer?.fantasyName ?? withdrawal.withdrawerName ?? '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'total',
        label: 'TOTAL',
        sortable: false,
        width: 1.4,
        align: 'right',
        canView: canViewPrices,
        render: (withdrawal) =>
          withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE
            ? formatCurrency(getOperationTotal(withdrawal))
            : '-',
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
    defaultVisible: ['withdrawerName', 'status', 'itemsCount', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (withdrawal, router) => {
          router.push(`/estoque/operacoes-externas/detalhes/${withdrawal.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditExternalOperations,
        // Aligned with the detail screen's editGuard (PENDING + PARTIALLY_RETURNED)
        visible: (withdrawal) =>
          !!withdrawal.status &&
          (EDITABLE_EXTERNAL_OPERATION_STATUSES as readonly EXTERNAL_OPERATION_STATUS[]).includes(withdrawal.status),
        onPress: (withdrawal, router) => {
          router.push(`/estoque/operacoes-externas/editar/${withdrawal.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteExternalOperations,
        confirm: {
          title: 'Confirmar Exclusão',
          message: (withdrawal) => `Deseja excluir a operação de "${withdrawal.withdrawerName}"?`,
        },
        onPress: async (withdrawal, _, context) => {
          await context?.delete?.(withdrawal.id)
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
        options: Object.values(EXTERNAL_OPERATION_STATUS).map((status) => ({
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
        key: 'createdAt',
        label: 'Data',
        type: 'date-range',
        placeholder: 'Data',
      },
    ],
  },

  search: {
    placeholder: 'Buscar operações...',
    debounce: 500,
  },

  export: {
    title: 'Operações Externas',
    filename: 'operacoes-externas',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'withdrawerName', label: 'Responsável', path: 'withdrawerName' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type' },
      { key: 'itemsCount', label: 'Itens', path: '_count.items' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'date' },
      { key: 'notes', label: 'Observações', path: 'notes' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Operação',
      route: '/estoque/operacoes-externas/cadastrar',
      canCreate: canEditExternalOperations,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'operação' : 'operações'}?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ externalOperationIds: Array.from(ids) })
        },
        canPerform: canDeleteExternalOperations,
      },
    ],
  },
}
