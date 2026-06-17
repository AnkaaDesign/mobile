import type { ListConfig } from '@/components/list/types'
import type { Termination } from '@/types'
import { TERMINATION_TYPE, TERMINATION_STATUS } from '@/constants/enums'
import {
  TERMINATION_TYPE_LABELS,
  TERMINATION_STATUS_LABELS,
} from '@/constants/enum-labels'
import { canEditHrEntities, canDeleteHrEntities } from '@/utils/permissions/entity-permissions'
import { formatCurrency } from '@/utils/number'

// Status → badge variant mapping for the Rescisões list.
function statusBadgeVariant(status?: TERMINATION_STATUS): string {
  switch (status) {
    case TERMINATION_STATUS.COMPLETED:
      return 'success'
    case TERMINATION_STATUS.CANCELLED:
      return 'destructive'
    case TERMINATION_STATUS.PAYMENT:
    case TERMINATION_STATUS.HOMOLOGATION:
      return 'primary'
    default:
      return 'secondary'
  }
}

export const terminationsListConfig: ListConfig<Termination> = {
  key: 'hr-terminations',
  title: 'Rescisões',

  query: {
    hook: 'useTerminationsInfinite',
    mutationsHook: 'useTerminationMutations',
    batchMutationsHook: 'useTerminationBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: { include: { position: true } },
    },
  },

  table: {
    columns: [
      {
        key: 'user.name',
        label: 'COLABORADOR',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (t) => t.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (t) => (t.type ? TERMINATION_TYPE_LABELS[t.type] : '—'),
        format: 'badge',
        badge: () => ({ variant: 'primary' }),
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (t) => (t.status ? TERMINATION_STATUS_LABELS[t.status] : '—'),
        format: 'badge',
        badge: (t: Termination) => ({ variant: statusBadgeVariant(t.status) as any }),
      },
      {
        key: 'terminationDate',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (t) => t.terminationDate,
        format: 'date',
      },
      {
        key: 'paidAmount',
        label: 'VALOR LÍQUIDO',
        sortable: true,
        width: 1.4,
        align: 'right',
        render: (t) => (t.paidAmount != null ? formatCurrency(t.paidAmount) : '—'),
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (t) => t.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'type', 'status'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (t, router) => {
          router.push(`/recursos-humanos/rescisoes/detalhes/${t.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditHrEntities,
        onPress: (t, router) => {
          router.push(`/recursos-humanos/rescisoes/editar/${t.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteHrEntities,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir esta rescisão?`,
        },
        onPress: async (t, _, context) => {
          await context?.delete?.(t.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'types',
        label: 'Tipo de Rescisão',
        type: 'select',
        multiple: true,
        options: Object.entries(TERMINATION_TYPE_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o tipo',
      },
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.entries(TERMINATION_STATUS_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o status',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'collaborators'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((user: any) => ({
                label: user.name,
                value: user.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
      {
        key: 'terminationDate',
        label: 'Data da Rescisão',
        type: 'date-range',
        placeholder: 'Data da Rescisão',
      },
    ],
  },

  search: {
    placeholder: 'Buscar rescisões...',
    debounce: 500,
  },

  export: {
    title: 'Rescisões',
    filename: 'rescisoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'type', label: 'Tipo', path: 'type', format: (value: any): string => (value ? TERMINATION_TYPE_LABELS[value as TERMINATION_TYPE] : '—') },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => (value ? TERMINATION_STATUS_LABELS[value as TERMINATION_STATUS] : '—') },
      { key: 'terminationDate', label: 'Data', path: 'terminationDate', format: 'date' },
      { key: 'paidAmount', label: 'Valor Líquido', path: 'paidAmount', format: (value: any): string => (value != null ? formatCurrency(Number(value)) : '—') },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Rescisão',
      route: '/recursos-humanos/rescisoes/cadastrar',
      canCreate: canEditHrEntities,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'rescisão' : 'rescisões'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ terminationIds: Array.from(ids) })
        },
        canPerform: canDeleteHrEntities,
      },
    ],
  },
}
