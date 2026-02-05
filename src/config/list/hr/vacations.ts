import type { ListConfig } from '@/components/list/types'
import type { Vacation } from '@/types'
import { VACATION_STATUS, VACATION_TYPE } from '@/constants/enums'
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '@/constants/enum-labels'
import { formatDate } from '@/utils'

export const vacationsListConfig: ListConfig<Vacation> = {
  key: 'hr-vacations',
  title: 'Férias',

  query: {
    hook: 'useVacationsInfiniteMobile',
    defaultSort: { field: 'startAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'user.name',
        label: 'FUNCIONÁRIO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (vacation) => vacation.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'period',
        label: 'PERÍODO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (vacation) =>
          vacation.startAt && vacation.endAt
            ? `${formatDate(new Date(vacation.startAt))} - ${formatDate(new Date(vacation.endAt))}`
            : '—',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (vacation) => vacation.status ? VACATION_STATUS_LABELS[vacation.status] : '—',
        format: 'badge',
        badgeEntity: 'VACATION',
      },
      {
        key: 'daysRequested',
        label: 'DIAS',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (vacation) => {
          // Calculate working days - web uses getWorkdaysBetween
          // For mobile, we can use the days field or calculate
          return String(0)
        },
      },
      {
        key: 'createdAt',
        label: 'SOLICITADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (vacation) => vacation.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'period', 'status'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (vacation, router) => {
          router.push(`/recursos-humanos/ferias/detalhes/${vacation.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        visible: (vacation) => vacation.status === 'PENDING',
        onPress: (vacation, router) => {
          router.push(`/recursos-humanos/ferias/editar/${vacation.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (vacation) => `Deseja excluir estas férias?`,
        },
        onPress: async (vacation, _, context) => {
          await context?.delete?.(vacation.id)
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
        multiple: false,
        options: Object.entries(VACATION_STATUS_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o status',
      },
      {
        key: 'type',
        label: 'Tipo de Férias',
        type: 'select',
        multiple: false,
        options: Object.entries(VACATION_TYPE_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o tipo',
      },
      {
        key: 'year',
        label: 'Ano',
        type: 'select',
        multiple: false,
        options: (() => {
          const currentYear = new Date().getFullYear()
          return Array.from({ length: 11 }, (_, i) => {
            const year = currentYear - 5 + i
            return { label: String(year), value: String(year) }
          })
        })(),
        placeholder: 'Selecione o ano',
      },
      {
        key: 'isCollective',
        label: 'Apenas Férias Coletivas',
        type: 'toggle',
        placeholder: 'Apenas férias coletivas',
      },
      {
        key: 'userIds',
        label: 'Funcionários',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter'],
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
            }
          } catch (error) {
            console.error('[User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os funcionários',
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
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'startAt', label: 'Início', path: 'startAt', format: 'date' },
      { key: 'endAt', label: 'Fim', path: 'endAt', format: 'date' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => VACATION_STATUS_LABELS[value as VACATION_STATUS] || String(value) },
      { key: 'days', label: 'Dias', path: 'days' },
      { key: 'createdAt', label: 'Solicitado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Férias',
      route: '/recursos-humanos/ferias/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'férias' : 'férias'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
