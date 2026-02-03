import type { ListConfig } from '@/components/list/types'
import type { Cut } from '@/types'
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from '@/constants/enums'
import { canEditCuts, canDeleteCuts } from '@/utils/permissions/entity-permissions'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CUTTING: 'Cortando',
  COMPLETED: 'Concluído',
}

const TYPE_LABELS: Record<string, string> = {
  VINYL: 'Adesivo',
  STENCIL: 'Espovo',
}

export const cuttingPlansListConfig: ListConfig<Cut> = {
  key: 'production-cutting-plans',
  title: 'Planos de Corte',

  query: {
    hook: 'useCutsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    defaultFilters: {
      where: {
        origin: CUT_ORIGIN.PLAN,
      },
    },
    include: {
      file: {
        select: {
          id: true,
          fileName: true,
          key: true,
        },
      },
      task: {
        select: {
          id: true,
          name: true,
          customer: {
            select: {
              id: true,
              fantasyName: true,
            },
          },
        },
      },
      parentCut: {
        select: {
          id: true,
          file: {
            select: {
              id: true,
              fileName: true,
              key: true,
            },
          },
        },
      },
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
        render: (cut) => cut.status,
        format: 'badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => TYPE_LABELS[cut.type] || cut.type,
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
        key: 'customer',
        label: 'CLIENTE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.task?.customer?.fantasyName || '-',
      },
      {
        key: 'file',
        label: 'ARQUIVO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.file?.fileName || cut.file?.key || '-',
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
    defaultVisible: ['task', 'status', 'type'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (cut, router) => {
          router.push(`/producao/recorte/detalhes/${cut.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditCuts,
        onPress: (cut, router) => {
          router.push(`/producao/recorte/editar/${cut.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteCuts,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir este plano de corte?`,
        },
        onPress: async (cut, _, { delete: deleteCut }) => {
          await deleteCut(cut.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(CUT_STATUS).map((status) => ({
          label: STATUS_LABELS[status],
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
          label: TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos de corte',
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
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
      {
        key: 'updatedAt',
        label: 'Data de Atualização',
        type: 'date-range',
        placeholder: 'Data de Atualização',
      },
    ],
  },

  search: {
    placeholder: 'Buscar planos de corte...',
    debounce: 500,
  },

  export: {
    title: 'Planos de Corte',
    filename: 'planos-de-corte',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => TYPE_LABELS[value] || value },
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'customer', label: 'Cliente', path: 'task.customer.name' },
      { key: 'file', label: 'Arquivo', path: 'file.fileName' },
      { key: 'startedAt', label: 'Início', path: 'startedAt', format: 'datetime' },
      { key: 'completedAt', label: 'Conclusão', path: 'completedAt', format: 'datetime' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Novo Plano de Corte',
      route: '/producao/recorte/plano-de-recorte/cadastrar',
      canCreate: canEditCuts,
    },
    bulk: [
      {
        key: 'start',
        label: 'Iniciar',
        icon: 'play',
        variant: 'default',
        confirm: {
          title: 'Confirmar Início',
          message: (count) => `Iniciar ${count} ${count === 1 ? 'plano' : 'planos'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'CUTTING', startedAt: new Date() })
        },
      },
      {
        key: 'complete',
        label: 'Concluir',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Conclusão',
          message: (count) => `Concluir ${count} ${count === 1 ? 'plano' : 'planos'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'COMPLETED', completedAt: new Date() })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'plano' : 'planos'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
