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
    pageSize: 25,
    include: {
      item: true,
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
        render: (activity) => activityquantity || '-',
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
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_OPERATION).map((operation) => ({
          label: ACTIVITY_OPERATION_LABELS[operation],
          value: operation,
        })),
        placeholder: 'Tipo de Operação',
      },
      {
        key: 'reasons',
        type: 'select',
        multiple: true,
        options: Object.values(ACTIVITY_REASON).map((reason) => ({
          label: ACTIVITY_REASON_LABELS[reason],
          value: reason,
        })),
        placeholder: 'Motivo da Movimentação',
      },
      {
        key: 'itemIds',
        type: 'select',
        multiple: true,
        placeholder: 'Produtos',
      },
      {
        key: 'userIds',
        type: 'select',
        multiple: true,
        placeholder: 'Usuários',
      },
      {
        key: 'quantityRange',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
      },
      {
        key: 'createdAt',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar atividades...',
    debounce: 300,
  },

  export: {
    title: 'Atividades da Equipe',
    filename: 'atividades-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'operation', label: 'Operação', path: 'operation', format: (value) => ACTIVITY_OPERATION_LABELS[value] || value },
      { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'reason', label: 'Motivo', path: 'reason', format: (value) => value ? ACTIVITY_REASON_LABELS[value] : '-' },
      { key: 'user', label: 'Usuário', path: 'user.name' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'datetime' },
    ],
  },

  // No create/edit/delete - activities are read-only from team perspective
  actions: undefined,
}
