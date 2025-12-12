import type { ListConfig } from '@/components/list/types'
import type { Activity } from '@/types'
import {
  ACTIVITY_OPERATION,
  ACTIVITY_REASON,
  ACTIVITY_OPERATION_LABELS,
  ACTIVITY_REASON_LABELS,
} from '@/constants'

export const personalMovementsListConfig: ListConfig<Activity> = {
  key: 'personal-movements',
  title: 'Minhas Movimentações',

  query: {
    hook: 'useMyActivitiesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
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
        render: (activity) => activity.item?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'operation',
        label: 'OPERAÇÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (activity) => ACTIVITY_OPERATION_LABELS[activity.operation] || activity.operation,
        format: 'badge',
        badgeEntity: 'ACTIVITY',
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => ACTIVITY_REASON_LABELS[activity.reason] || activity.reason,
        format: 'badge',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (activity) => String(activity.quantity || 0),
        format: 'number',
      },
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (activity) => activity.item?.uniCode || '-',
      },
      {
        key: 'item.category.name',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (activity) => activity.item?.category?.name || '-',
      },
      {
        key: 'item.brand.name',
        label: 'MARCA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (activity) => activity.item?.brand?.name || '-',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (activity) => activity.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['item.name', 'operation', 'reason', 'quantity', 'createdAt'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'operations',
        label: 'Operações',
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_OPERATION).map((operation) => ({
          label: ACTIVITY_OPERATION_LABELS[operation],
          value: operation,
        })),
        placeholder: 'Selecione as operações',
      },
      {
        key: 'reasons',
        label: 'Motivos',
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_REASON).map((reason) => ({
          label: ACTIVITY_REASON_LABELS[reason],
          value: reason,
        })),
        placeholder: 'Selecione os motivos',
      },
      {
        key: 'createdAt',
        label: 'Período de Atividade',
        type: 'date-range',
        placeholder: 'Período de Atividade',
      },
    ],
  },

  search: {
    placeholder: 'Buscar movimentações...',
    debounce: 300,
  },

  export: {
    title: 'Minhas Movimentações',
    filename: 'minhas-movimentacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
      { key: 'category', label: 'Categoria', path: 'item.category.name' },
      { key: 'brand', label: 'Marca', path: 'item.brand.name' },
      { key: 'operation', label: 'Operação', path: 'operation', format: (value) => ACTIVITY_OPERATION_LABELS[value] || value },
      { key: 'reason', label: 'Motivo', path: 'reason', format: (value) => ACTIVITY_REASON_LABELS[value] || value },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'date' },
    ],
  },

  // No create/edit/delete for personal activities - read-only view
  actions: undefined,

  emptyState: {
    icon: 'clock',
    title: 'Nenhuma movimentação encontrada',
    description: 'Você não possui movimentações registradas',
  },
}
