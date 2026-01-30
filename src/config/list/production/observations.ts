import type { ListConfig } from '@/components/list/types'
import type { Observation } from '@/types'
import { canEditObservations, canDeleteObservations } from '@/utils/permissions/entity-permissions'


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
        render: (observation) => String(observation.files?.length || 0),
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (observation) => observation.createdAt,
        format: 'date',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (observation) => observation.updatedAt,
        format: 'date',
      },
    ],
    defaultVisible: ['task', 'description', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
        canPerform: canEditObservations,
        onPress: (observation, router) => {
          router.push(`/producao/observacoes/editar/${observation.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteObservations,
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
    fields: [
      {
        key: 'taskIds',
        label: 'Tarefas',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['tasks', 'filter', 'sector-aware'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            // Use sector-aware task filter (team leaders only see their sector's tasks)
            const { fetchTasksForFilter } = await import('@/utils/task-filter')
            return fetchTasksForFilter({
              searchTerm,
              page,
              pageSize: 20,
              orderBy: { createdAt: 'desc' },
            })
          } catch (error) {
            console.error('[Task Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as tarefas',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
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
      canCreate: canEditObservations,
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
