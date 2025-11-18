import type { ListConfig } from '@/components/list/types'
import type { Airbrushing } from '@/types'
import { canEditAirbrushings } from '@/utils/permissions/entity-permissions'
import { AIRBRUSHING_STATUS } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PRODUCTION: 'Em Produção',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

export const airbrushingListConfig: ListConfig<Airbrushing> = {
  key: 'production-airbrushing',
  title: 'Aerografia',

  query: {
    hook: 'useAirbrushingsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      task: {
        include: {
          customer: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'task',
        label: 'TAREFA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (airbrushing) => airbrushing.task?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.3,
        align: 'center',
        render: (airbrushing) => airbrushing.status,
        format: 'badge',
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (airbrushing) => airbrushing.price || 0,
        format: 'currency',
      },
      {
        key: 'customer',
        label: 'CLIENTE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (airbrushing) => airbrushing.task?.customer?.fantasyName || '-',
      },
      {
        key: 'startDate',
        label: 'INÍCIO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (airbrushing) => airbrushing.startDate,
        format: 'date',
      },
      {
        key: 'finishDate',
        label: 'TÉRMINO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (airbrushing) => airbrushing.finishDate,
        format: 'date',
      },
      {
        key: 'observations',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (airbrushing) => airbrushing.observations || '-',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (airbrushing) => airbrushing.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['task', 'status', 'price'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (airbrushing, router) => {
          router.push(`/producao/aerografia/detalhes/${airbrushing.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        visible: (airbrushing) => airbrushing.status !== 'COMPLETED' && airbrushing.status !== 'CANCELLED',
        onPress: (airbrushing, router) => {
          router.push(`/producao/aerografia/editar/${airbrushing.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (airbrushing) => `Deseja excluir esta aerografia?`,
        },
        onPress: async (airbrushing, _, { delete: deleteAirbrushing }) => {
          await deleteAirbrushing(airbrushing.id)
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
            options: Object.values(AIRBRUSHING_STATUS).map((status) => ({
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
            key: 'taskId',
            label: 'Tarefa',
            type: 'select',
            multiple: false,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione a tarefa',
          },
          {
            key: 'customerId',
            label: 'Cliente',
            type: 'select',
            multiple: false,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione o cliente',
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
            key: 'hasPrice',
            label: 'Com Preço',
            description: 'Apenas aerografias com preço definido',
            type: 'toggle',
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
            key: 'priceRange',
            label: 'Preço (R$)',
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
            key: 'startDate',
            label: 'Data de Início',
            type: 'date-range',
          },
          {
            key: 'finishDate',
            label: 'Data de Término',
            type: 'date-range',
          },
          {
            key: 'createdAt',
            label: 'Data de Cadastro',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar aerografias...',
    debounce: 300,
  },

  export: {
    title: 'Aerografias',
    filename: 'aerografias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'price', label: 'Preço', path: 'price', format: 'currency' },
      { key: 'customer', label: 'Cliente', path: 'task.customer.fantasyName' },
      { key: 'startDate', label: 'Início', path: 'startDate', format: 'date' },
      { key: 'finishDate', label: 'Término', path: 'finishDate', format: 'date' },
      { key: 'observations', label: 'Observações', path: 'observations' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Aerografia',
      route: '/producao/aerografia/cadastrar',
      canCreate: canEditAirbrushings,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'aerografia' : 'aerografias'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
