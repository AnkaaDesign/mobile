import type { ListConfig } from '@/components/list/types'
import type { Task } from '@/types'
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  COMMISSION_STATUS,
} from '@/constants'

export const tasksListConfig: ListConfig<Task> = {
  key: 'production-tasks',
  title: 'Tarefas',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'priority', direction: 'desc' },
    pageSize: 25,
    include: {
      customer: true,
      sector: true,
      generalPainting: true,
      services: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'TÍTULO',
        sortable: true,
        width: 2.5,
        align: 'left',
        render: (task) => task.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'serialNumber',
        label: 'NÚMERO DE SÉRIE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (task) => task.serialNumber || '-',
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
        key: 'priority',
        label: 'PRIORIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (task) => task.priority || '-',
        format: 'badge',
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
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.sector?.name || 'Sem setor',
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
        key: 'entryDate',
        label: 'DATA DE ENTRADA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (task) => task.entryDate,
        format: 'date',
      },
      {
        key: 'startedAt',
        label: 'INICIADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (task) => task.startedAt,
        format: 'datetime',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (task) => task.finishedAt,
        format: 'datetime',
      },
      {
        key: 'chassisNumber',
        label: 'NÚMERO DO CHASSI',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (task) => task.truck?.chassisNumber || '-',
      },
      {
        key: 'plate',
        label: 'PLACA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (task) => task.truck?.plate || '-',
      },
      {
        key: 'details',
        label: 'DETALHES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (task) => task.details || '-',
      },
      {
        key: 'commission',
        label: 'COMISSÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (task) => task.commission,
        format: 'badge',
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (task) => task.price || null,
        format: 'currency',
      },
      {
        key: 'generalPainting.name',
        label: 'PINTURA GERAL',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (task) => task.generalPainting?.name || '-',
      },
      {
        key: 'services',
        label: 'SERVIÇOS',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (task) => {
          if (!task.services || task.services.length === 0) return '-'
          return task.services.map((s: any) => s.name).join(', ')
        },
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task) => task.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'status', 'priority', 'term'],
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
            options: Object.values(TASK_STATUS).map((status) => ({
              label: TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] || status,
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'priority',
        label: 'Prioridade',
        icon: 'alert-circle',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'priority',
            label: 'Prioridade',
            type: 'select',
            multiple: true,
            options: [
              { label: 'Baixa', value: 'LOW' },
              { label: 'Média', value: 'MEDIUM' },
              { label: 'Alta', value: 'HIGH' },
              { label: 'Urgente', value: 'URGENT' },
            ],
            placeholder: 'Selecione as prioridades',
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
        label: 'Responsável',
        icon: 'user',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'createdByIds',
            label: 'Criado por',
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
            key: 'term',
            label: 'Prazo',
            type: 'date-range',
          },
          {
            key: 'entryDate',
            label: 'Data de Entrada',
            type: 'date-range',
          },
          {
            key: 'startedAt',
            label: 'Data de Início',
            type: 'date-range',
          },
          {
            key: 'finishedAt',
            label: 'Data de Conclusão',
            type: 'date-range',
          },
          {
            key: 'createdAt',
            label: 'Data de Criação',
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
    placeholder: 'Buscar tarefas...',
    debounce: 300,
  },

  export: {
    title: 'Tarefas',
    filename: 'tarefas',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Título', path: 'name' },
      { key: 'serialNumber', label: 'Número de Série', path: 'serialNumber' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'priority', label: 'Prioridade', path: 'priority' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'term', label: 'Prazo', path: 'term', format: 'date' },
      { key: 'entryDate', label: 'Data de Entrada', path: 'entryDate', format: 'date' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'datetime' },
      { key: 'finishedAt', label: 'Finalizado Em', path: 'finishedAt', format: 'datetime' },
      { key: 'chassisNumber', label: 'Número do Chassi', path: 'truck.chassisNumber' },
      { key: 'plate', label: 'Placa', path: 'truck.plate' },
      { key: 'details', label: 'Detalhes', path: 'details' },
      { key: 'price', label: 'Preço', path: 'price', format: 'currency' },
      { key: 'commission', label: 'Comissão', path: 'commission' },
      { key: 'generalPainting', label: 'Pintura Geral', path: 'generalPainting.name' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Tarefa',
      route: '/producao/cronograma/cadastrar',
    },
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
          // This is a placeholder for the structure
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
          // This is a placeholder for the structure
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
