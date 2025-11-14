import type { ListConfig } from '@/components/list/types'
import type { Observation } from '@/types'

export const observationsListConfig: ListConfig<Observation> = {
  key: 'production-observations',
  title: 'Observações',

  query: {
    hook: 'useObservationsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      task: true,
      files: true,
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
        render: (observation) => observation.task?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: false,
        width: 3.0,
        align: 'left',
        render: (observation) => observation.description,
      },
      {
        key: 'filesCount',
        label: 'ARQUIVOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (observation) => observation.files?.length || 0,
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (observation) => observation.createdAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['task', 'description', 'createdAt'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (observation, router) => {
          router.push(`/producao/observacoes/detalhes/${observation.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (observation, router) => {
          router.push(`/producao/observacoes/editar/${observation.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir esta observação?`,
        },
        onPress: async (observation, _, { delete: deleteObservation }) => {
          await deleteObservation(observation.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'entities',
        label: 'Relacionamentos',
        icon: 'link',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'taskIds',
            label: 'Tarefas',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione as tarefas',
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
    placeholder: 'Buscar observações...',
    debounce: 300,
  },

  export: {
    title: 'Observações',
    filename: 'observacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Nova Observação',
      route: '/producao/observacoes/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'observação' : 'observações'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
