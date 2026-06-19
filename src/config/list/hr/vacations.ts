import type { ListConfig } from '@/components/list/types'
import type { Vacation } from '@/types'
import { VACATION_STATUS } from '@/constants/enums'
import { VACATION_STATUS_LABELS } from '@/constants/enum-labels'
import { canEditHrEntities, canDeleteDpRecords } from '@/utils/permissions/entity-permissions'
import { isVacationInProgress } from '@/components/human-resources/vacation/vacation-utils'

// Status → Badge variant (no VACATION entry in getBadgeVariant; map inline like warnings).
const STATUS_VARIANT: Record<VACATION_STATUS, string> = {
  [VACATION_STATUS.SCHEDULED]: 'warning',
  [VACATION_STATUS.PAID]: 'success',
  [VACATION_STATUS.EXPIRED]: 'error',
}

/**
 * Concessivo-expiry helper: how many days until the período concessivo
 * (art. 137 dobro) expires. Negative → already expired.
 */
export function vacationDaysUntilConcessiveEnd(v: Vacation): number | null {
  if (!v.concessiveEnd) return null
  const end = new Date(v.concessiveEnd)
  if (isNaN(end.getTime())) return null
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/** Expiry badge: 'expired' (vencido/dobro), 'onHold' (<30d) or null. */
export function vacationConcessiveBadge(v: Vacation): string | null {
  if (v.status === VACATION_STATUS.PAID) return null
  const days = vacationDaysUntilConcessiveEnd(v)
  if (days === null) return null
  if (days < 0) return 'expired'
  if (days <= 30) return 'onHold'
  return null
}

export const vacationsListConfig: ListConfig<Vacation> = {
  key: 'hr-vacations',
  title: 'Férias',

  query: {
    hook: 'useVacationsInfinite',
    mutationsHook: 'useVacationMutations',
    batchMutationsHook: 'useVacationBatchMutations',
    defaultSort: { field: 'concessiveEnd', direction: 'asc' },
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
        render: (v) => v.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (v) => (isVacationInProgress(v) ? 'Em gozo' : VACATION_STATUS_LABELS[v.status] || v.status),
        format: 'badge',
        badge: (v) => ({ variant: isVacationInProgress(v) ? 'active' : STATUS_VARIANT[v.status] ?? 'default' }),
      },
      {
        key: 'days',
        label: 'GOZO (DIAS)',
        sortable: true,
        width: 0.9,
        align: 'center',
        render: (v) => `${v.days ?? 0}d`,
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
        key: 'entitledDays',
        label: 'DIREITO (DIAS)',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (v) => `${v.entitledDays ?? 0}d`,
      },
      {
        key: 'acquisitiveStart',
        label: 'AQUISITIVO',
        sortable: true,
        width: 1.6,
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
      {
        key: 'vencimento',
        label: 'VENCIMENTO',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (v) => {
          const days = vacationDaysUntilConcessiveEnd(v)
          if (days === null) return '—'
          if (days < 0) return 'Vencido'
          if (days <= 30) return `${days}d`
          return '—'
        },
        format: 'badge',
        badge: (v) => {
          const variant = vacationConcessiveBadge(v)
          return variant ? { variant } : { variant: 'muted' }
        },
      },
      {
        key: 'isDouble',
        label: 'DOBRO',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (v) => (v.isDouble ? 'Sim' : '—'),
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (v) => v.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'status', 'days', 'startDate'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (v, router) => {
          router.push(`/recursos-humanos/ferias/detalhes/${v.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditHrEntities,
        onPress: (v, router) => {
          router.push(`/recursos-humanos/ferias/editar/${v.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteDpRecords,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => 'Deseja excluir este registro de férias?',
        },
        onPress: async (v, _, context) => {
          await context?.delete?.(v.id)
        },
      },
    ],
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
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'vacation-collaborators'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page,
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
            console.error('[Vacation Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'concessiveEnd',
        label: 'Limite Concessivo',
        type: 'date-range',
        placeholder: 'Limite Concessivo',
      },
      {
        key: 'acquisitiveStart',
        label: 'Início do Aquisitivo',
        type: 'date-range',
        placeholder: 'Início do Aquisitivo',
      },
    ],
  },

  search: {
    placeholder: 'Buscar férias...',
    debounce: 500,
  },

  export: {
    title: 'Férias',
    filename: 'ferias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => value ? VACATION_STATUS_LABELS[value as VACATION_STATUS] : '—' },
      { key: 'days', label: 'Dias de Gozo', path: 'days' },
      { key: 'startDate', label: 'Início do Gozo', path: 'startDate', format: 'date' },
      { key: 'entitledDays', label: 'Dias de Direito', path: 'entitledDays' },
      { key: 'acquisitiveStart', label: 'Início Aquisitivo', path: 'acquisitiveStart', format: 'date' },
      { key: 'acquisitiveEnd', label: 'Fim Aquisitivo', path: 'acquisitiveEnd', format: 'date' },
      { key: 'concessiveEnd', label: 'Limite Concessivo', path: 'concessiveEnd', format: 'date' },
      { key: 'isDouble', label: 'Dobro', path: 'isDouble', format: (value: any): string => value ? 'Sim' : 'Não' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Férias',
      route: '/recursos-humanos/ferias/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'registro' : 'registros'} de férias?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ vacationIds: Array.from(ids) })
        },
        canPerform: canDeleteDpRecords,
      },
    ],
  },

  emptyState: {
    icon: 'palmtree',
    title: 'Nenhum registro de férias',
    description: 'Cadastre o período aquisitivo de férias de um colaborador',
  },
}
