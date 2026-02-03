import type { ListConfig } from '@/components/list/types'
import type { Airbrushing } from '@/types'
import { canEditAirbrushings, canDeleteAirbrushings, canViewAirbrushingFinancials } from '@/utils/permissions/entity-permissions'
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
        select: {
          id: true,
          name: true,
          customer: {
            select: {
              id: true,
              fantasyName: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      artworks: {
        select: {
          id: true,
          fileId: true,
        },
      },
      receipts: {
        select: {
          id: true,
        },
      },
      invoices: {
        select: {
          id: true,
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
        align: 'left',
        render: (airbrushing) => STATUS_LABELS[airbrushing.status] || airbrushing.status,
        format: 'badge',
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (airbrushing) => String(airbrushing.price || 0),
        format: 'currency',
        canView: canViewAirbrushingFinancials,
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
        label: 'DATA INÍCIO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (airbrushing) => airbrushing.startDate,
        format: 'date',
      },
      {
        key: 'finishDate',
        label: 'DATA FINALIZAÇÃO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (airbrushing) => airbrushing.finishDate,
        format: 'date',
      },
      {
        key: 'artworksCount',
        label: 'ARTES',
        sortable: false,
        width: 0.8,
        align: 'left',
        render: (airbrushing) => String((airbrushing as any).artworks?.length || 0),
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
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (airbrushing) => airbrushing.createdAt,
        format: 'date',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (airbrushing) => airbrushing.updatedAt,
        format: 'date',
      },
    ],
    defaultVisible: ['task', 'status', 'startDate'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
        canPerform: canEditAirbrushings,
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
        canPerform: canDeleteAirbrushings,
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
        key: 'priceRange',
        label: 'Preço',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
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
    placeholder: 'Buscar airbrushings...',
    debounce: 500,
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
