import type { ListConfig } from '@/components/list/types'
import type { Vacation } from '@/types'
import { VACATION_STATUS } from '@/constants/enums'
import { VACATION_STATUS_LABELS } from '@/constants/enum-labels'
import { isVacationInProgress } from '@/components/human-resources/vacation/vacation-utils'

// Status → Badge variant. SCHEDULED = amber, PAID = green, EXPIRED = red.
const STATUS_VARIANT: Record<VACATION_STATUS, string> = {
  [VACATION_STATUS.SCHEDULED]: 'warning',
  [VACATION_STATUS.PAID]: 'success',
  [VACATION_STATUS.EXPIRED]: 'error',
}

/**
 * Read-only self-service list of the signed-in user's own vacations.
 * `useMyVacationsInfinite` injects `where.userId = me`.
 */
export const personalVacationsListConfig: ListConfig<Vacation> = {
  key: 'personal-vacations',
  title: 'Minhas Férias',

  query: {
    hook: 'useMyVacationsInfinite',
    defaultSort: { field: 'concessiveEnd', direction: 'asc' },
    pageSize: 25,
    include: {
      user: { include: { position: true } },
    },
  },

  table: {
    columns: [
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (v) => (isVacationInProgress(v) ? 'Em gozo' : VACATION_STATUS_LABELS[v.status] || v.status),
        format: 'badge',
        badge: (v) => ({ variant: isVacationInProgress(v) ? 'active' : STATUS_VARIANT[v.status] ?? 'default' }),
      },
      {
        key: 'startDate',
        label: 'INÍCIO DO GOZO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (v) => v.startDate ?? '—',
        format: 'date',
      },
      {
        key: 'days',
        label: 'GOZO (DIAS)',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (v) => `${v.days ?? 0}d`,
      },
      {
        key: 'acquisitiveStart',
        label: 'AQUISITIVO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (v) => v.acquisitiveStart,
        format: 'date',
      },
      {
        key: 'concessiveEnd',
        label: 'LIMITE CONCESSIVO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (v) => v.concessiveEnd,
        format: 'date',
      },
    ],
    defaultVisible: ['status', 'startDate', 'days'],
    rowHeight: 72,
    actions: [],
    onRowPress: (v, router) => {
      router.push(`/(tabs)/pessoal/minhas-ferias/detalhes/${v.id}` as any)
    },
  },

  filters: {
    fields: [
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(VACATION_STATUS).map((status) => ({
          label: VACATION_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione o status',
      },
      {
        key: 'concessiveEnd',
        label: 'Limite Concessivo',
        type: 'date-range',
        placeholder: 'Limite Concessivo',
      },
    ],
  },

  search: {
    placeholder: 'Buscar férias...',
    debounce: 500,
  },

  // Read-only self-service: no create/edit/delete.
  actions: undefined,

  emptyState: {
    icon: 'palmtree',
    title: 'Nenhum registro de férias',
    description: 'Você não possui períodos de férias registrados',
  },
}
