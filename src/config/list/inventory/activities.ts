import type { ListConfig } from '@/components/list/types'
import type { Activity } from '@/types'
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON, ACTIVITY_REASON_LABELS } from '@/constants/enums'

export const activitiesListConfig: ListConfig<Activity> = {
  key: 'inventory-activities',
  title: 'Movimentações',

  query: {
    hook: 'useActivitiesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: true,
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'operation',
        label: 'OPERAÇÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (activity) => activity.operation,
        format: 'badge',
      },
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (activity) => activity.item?.uniCode || '-',
      },
      {
        key: 'item.name',
        label: 'PRODUTO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (activity) => activity.item?.name || 'Item não encontrado',
        style: { fontWeight: '500' },
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
        key: 'reason',
        label: 'MOTIVO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.reason ? ACTIVITY_REASON_LABELS[activity.reason] : '-',
        format: 'badge',
      },
      {
        key: 'user.name',
        label: 'USUÁRIO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.user?.name || '-',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (activity) => activity.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['operation', 'item.name', 'quantity'],
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
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (activity, router) => {
          router.push(`/estoque/movimentacoes/editar/${activity.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (activity) => `Deseja excluir esta movimentação?`,
        },
        onPress: async (activity, _, { delete: deleteActivity }) => {
          await deleteActivity(activity.id)
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
              // Will be loaded by the filter component
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
              // Will be loaded by the filter component
              return []
            },
            placeholder: 'Selecione os usuários',
          },
        ],
      },
      {
        key: 'options',
        label: 'Opções',
        icon: 'settings',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'hasUser',
            label: 'Com Usuário',
            description: 'Apenas movimentações associadas a um usuário',
            type: 'toggle',
          },
          {
            key: 'showPaintProduction',
            label: 'Produção de Tintas',
            description: 'Incluir movimentações de produção de tintas',
            type: 'toggle',
            defaultValue: true,
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
    placeholder: 'Buscar movimentações...',
    debounce: 300,
  },

  export: {
    title: 'Movimentações',
    filename: 'movimentacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'operation', label: 'Operação', path: 'operation', format: (value) => ACTIVITY_OPERATION_LABELS[value] || value },
      { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
      { key: 'itemName', label: 'Produto', path: 'item.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'reason', label: 'Motivo', path: 'reason', format: (value) => value ? ACTIVITY_REASON_LABELS[value] : '-' },
      { key: 'user', label: 'Usuário', path: 'user.name' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Movimentação',
      route: '/estoque/movimentacoes/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'movimentação' : 'movimentações'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
