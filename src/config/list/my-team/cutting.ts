import type { ListConfig } from '@/components/list/types'
import type { Cut } from '@/types'
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from '@/constants/enums'
import { CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from '@/constants/enum-labels'

export const teamCuttingListConfig: ListConfig<Cut> = {
  key: 'my-team-cutting',
  title: 'Recortes da Equipe',

  query: {
    hook: 'useCutsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      file: true,
      task: true,
      parentCut: true,
    },
  },

  table: {
    columns: [
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => CUT_STATUS_LABELS[cut.status] || cut.status,
        format: 'badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => CUT_TYPE_LABELS[cut.type] || cut.type,
      },
      {
        key: 'origin',
        label: 'ORIGEM',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => CUT_ORIGIN_LABELS[cut.origin] || cut.origin,
      },
      {
        key: 'task',
        label: 'TAREFA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.task?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'file',
        label: 'ARQUIVO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.file?.filename || cut.file?.fileName || '-',
      },
      {
        key: 'startedAt',
        label: 'INÍCIO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.startedAt,
        format: 'datetime',
      },
      {
        key: 'completedAt',
        label: 'CONCLUSÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.completedAt,
        format: 'datetime',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.createdAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['status', 'type', 'task'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_STATUS).map((status) => ({
          label: CUT_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'type',
        label: 'Tipo de Corte',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_TYPE).map((type) => ({
          label: CUT_TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos de corte',
      },
      {
        key: 'origin',
        label: 'Origem do Corte',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_ORIGIN).map((origin) => ({
          label: CUT_ORIGIN_LABELS[origin],
          value: origin,
        })),
        placeholder: 'Selecione as origens',
      },
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
        key: 'startedAt',
        label: 'Data de Início',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
      {
        key: 'completedAt',
        label: 'Data de Conclusão',
        type: 'date-range',
        placeholder: 'Data de Conclusão',
      },
    ],
  },

  search: {
    placeholder: 'Buscar recortes...',
    debounce: 500,
  },

  export: {
    title: 'Recortes da Equipe',
    filename: 'recortes-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'status', label: 'Status', path: 'status', format: (value) => CUT_STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => CUT_TYPE_LABELS[value] || value },
      { key: 'origin', label: 'Origem', path: 'origin', format: (value) => CUT_ORIGIN_LABELS[value] || value },
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'file', label: 'Arquivo', path: 'file.filename' },
      { key: 'startedAt', label: 'Início', path: 'startedAt', format: 'datetime' },
      { key: 'completedAt', label: 'Conclusão', path: 'completedAt', format: 'datetime' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
    ],
  },

  // No create/edit/delete - team cuts are managed in production module
  actions: undefined,
}
