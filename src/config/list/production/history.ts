import type { ListConfig } from '@/components/list/types'
import type { Task } from '@/types'
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
} from '@/constants'

export const historyListConfig: ListConfig<Task> = {
  key: 'production-history',
  title: 'Histórico de Produção',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'finishedAt', direction: 'desc' },
    pageSize: 25,
    include: {
      customer: true,
      sector: true,
      generalPainting: true,
      updatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    defaultWhere: {
      status: {
        in: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED],
      },
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (task) => task.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (task) => task.customer?.fantasyName || '-',
      },
      {
        key: 'generalPainting.name',
        label: 'PINTURA',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (task) => task.generalPainting?.name || '-',
      },
      {
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.sector?.name || '-',
        format: 'badge',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (task) => TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status,
        format: 'badge',
      },
      {
        key: 'serialNumber',
        label: 'Nº SÉRIE',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.serialNumber || '-',
      },
      {
        key: 'plate',
        label: 'PLACA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (task) => task.plate?.toUpperCase() || '-',
      },
      {
        key: 'chassisNumber',
        label: 'Nº CHASSI',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (task) => task.chassisNumber || '-',
      },
      {
        key: 'entryDate',
        label: 'ENTRADA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.entryDate,
        format: 'date',
      },
      {
        key: 'startedAt',
        label: 'INICIADO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.startedAt,
        format: 'date',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.finishedAt,
        format: 'date',
      },
      {
        key: 'term',
        label: 'PRAZO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.term,
        format: 'date',
      },
      {
        key: 'services',
        label: 'SERVIÇOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (task) => task.services?.length || 0,
        format: 'badge',
      },
      {
        key: 'details',
        label: 'DETALHES',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (task) => task.details || '-',
      },
      {
        key: 'observation',
        label: 'OBSERVAÇÃO',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (task) => task.observation?.description || '-',
      },
    ],
    defaultVisible: ['name', 'customer.fantasyName', 'status', 'finishedAt'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (task, router) => {
          router.push(`/producao/cronograma/detalhes/${task.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (task, router) => {
          router.push(`/producao/cronograma/editar/${task.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (task) => `Deseja excluir a tarefa "${task.name}"?`,
        },
        onPress: async (task, _, { delete: deleteTask }) => {
          await deleteTask(task.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'list-checks',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            multiple: true,
            options: [
              {
                label: TASK_STATUS_LABELS[TASK_STATUS.COMPLETED],
                value: TASK_STATUS.COMPLETED,
              },
              {
                label: TASK_STATUS_LABELS[TASK_STATUS.CANCELLED],
                value: TASK_STATUS.CANCELLED,
              },
              {
                label: TASK_STATUS_LABELS[TASK_STATUS.INVOICED],
                value: TASK_STATUS.INVOICED,
              },
              {
                label: TASK_STATUS_LABELS[TASK_STATUS.SETTLED],
                value: TASK_STATUS.SETTLED,
              },
            ],
            placeholder: 'Selecione os status',
            defaultValue: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED],
          },
        ],
      },
      {
        key: 'entities',
        label: 'Clientes e Setores',
        icon: 'users',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'customerIds',
            label: 'Clientes',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
              return []
            },
            placeholder: 'Selecione os clientes',
          },
          {
            key: 'sectorIds',
            label: 'Setores',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
              return []
            },
            placeholder: 'Selecione os setores',
          },
        ],
      },
      {
        key: 'assignee',
        label: 'Finalizador',
        icon: 'user',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'assigneeIds',
            label: 'Finalizado por',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
              return []
            },
            placeholder: 'Selecione os usuários',
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
            key: 'finishedDateRange',
            label: 'Data de Finalização',
            type: 'date-range',
          },
          {
            key: 'entryDateRange',
            label: 'Data de Entrada',
            type: 'date-range',
          },
          {
            key: 'startedDateRange',
            label: 'Data de Início',
            type: 'date-range',
          },
        ],
      },
      {
        key: 'ranges',
        label: 'Faixas de Valores',
        icon: 'coins',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'priceRange',
            label: 'Preço (R$)',
            type: 'number-range',
            placeholder: { min: 'Mín', max: 'Máx' },
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar por cliente, placa, chassi...',
    debounce: 300,
  },

  export: {
    title: 'Histórico de Produção',
    filename: 'historico-producao',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'generalPainting', label: 'Pintura', path: 'generalPainting.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'serialNumber', label: 'Nº Série', path: 'serialNumber' },
      { key: 'plate', label: 'Placa', path: 'plate' },
      { key: 'chassisNumber', label: 'Nº Chassi', path: 'chassisNumber' },
      { key: 'entryDate', label: 'Data de Entrada', path: 'entryDate', format: 'date' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'date' },
      { key: 'finishedAt', label: 'Finalizado Em', path: 'finishedAt', format: 'date' },
      { key: 'term', label: 'Prazo', path: 'term', format: 'date' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'observation', label: 'Observação', path: 'observation.description' },
    ],
  },

  actions: {
    bulk: [
      {
        key: 'update-status',
        label: 'Atualizar Status',
        icon: 'list-checks',
        variant: 'default',
        confirm: {
          title: 'Atualizar Status',
          message: (count) => `Deseja atualizar o status de ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, { batchUpdateAsync }) => {
          // Implementation would need to prompt for new status
          await batchUpdateAsync({ ids: Array.from(ids), data: {} })
        },
      },
      {
        key: 'update-sector',
        label: 'Atribuir Setor',
        icon: 'users',
        variant: 'default',
        confirm: {
          title: 'Atribuir Setor',
          message: (count) => `Deseja atribuir um setor a ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, { batchUpdateAsync }) => {
          // Implementation would need to prompt for sector
          await batchUpdateAsync({ ids: Array.from(ids), data: {} })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'tarefa' : 'tarefas'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
