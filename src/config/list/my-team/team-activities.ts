import type { ListConfig } from '@/components/list/types'
import type { Activity } from '@/types'
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON, ACTIVITY_REASON_LABELS } from '@/constants/enums'

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
        render: (activity) => activity.operation,
        format: 'badge',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (activity) => activity.quantity,
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
        render: (activity) => activity.createdAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['item.uniCode', 'item.name', 'operation', 'quantity', 'user.name'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (activity, router) => {
          router.push(`/estoque/movimentacoes/detalhes/${activity.id}`)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'operation',
        label: 'Operação',
        icon: 'activity',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'operations',
            label: 'Tipo de Operação',
            type: 'select',
            multiple: true,
            options: Object.values(ACTIVITY_OPERATION).map((operation) => ({
              label: ACTIVITY_OPERATION_LABELS[operation],
              value: operation,
            })),
            placeholder: 'Selecione as operações',
          },
        ],
      },
      {
        key: 'reason',
        label: 'Motivo',
        icon: 'tag',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'reasons',
            label: 'Motivo da Movimentação',
            type: 'select',
            multiple: true,
            options: Object.values(ACTIVITY_REASON).map((reason) => ({
              label: ACTIVITY_REASON_LABELS[reason],
              value: reason,
            })),
            placeholder: 'Selecione os motivos',
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
            key: 'itemIds',
            label: 'Produtos',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os produtos',
          },
          {
            key: 'userIds',
            label: 'Usuários',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os usuários',
          },
        ],
      },
      {
        key: 'ranges',
        label: 'Faixas',
        icon: 'adjustments',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'quantityRange',
            label: 'Quantidade',
            type: 'number-range',
            placeholder: { min: 'Mínimo', max: 'Máximo' },
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
            label: 'Data de Criação',
            type: 'date-range',
          },
        ],
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
