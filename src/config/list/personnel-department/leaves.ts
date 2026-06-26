import type { ListConfig } from '@/components/list/types'
import type { Leave } from '@/types'
import { LEAVE_TYPE, LEAVE_STATUS } from '@/constants/enums'
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '@/constants/enum-labels'
import { canEditOccupationalHealth, canDeleteOccupationalHealth } from '@/utils/permissions/entity-permissions'

export const leavesListConfig: ListConfig<Leave> = {
  key: 'hr-leaves',
  title: 'Afastamentos',

  query: {
    hook: 'useLeavesInfiniteMobile',
    mutationsHook: 'useLeaveMutations',
    batchMutationsHook: 'useLeaveBatchMutations',
    defaultSort: { field: 'startDate', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
      files: true,
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
        render: (leave) => leave.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (leave) => leave.type ? LEAVE_TYPE_LABELS[leave.type as LEAVE_TYPE] : '—',
        format: 'badge',
        badge: () => ({ variant: 'secondary' }),
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (leave) => leave.status ? LEAVE_STATUS_LABELS[leave.status as LEAVE_STATUS] : '—',
        format: 'badge',
        badge: () => ({ variant: 'primary' }),
      },
      {
        key: 'startDate',
        label: 'INÍCIO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (leave) => leave.startDate,
        format: 'date',
      },
      {
        key: 'expectedEndDate',
        label: 'PREVISÃO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (leave) => leave.expectedEndDate,
        format: 'date',
      },
      {
        key: 'actualEndDate',
        label: 'RETORNO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (leave) => leave.actualEndDate,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'type', 'status', 'startDate'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (leave, router) => {
          router.push(`/departamento-pessoal/medicina/afastamentos/detalhes/${leave.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditOccupationalHealth,
        onPress: (leave, router) => {
          router.push(`/departamento-pessoal/medicina/afastamentos/editar/${leave.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteOccupationalHealth,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir este afastamento?`,
        },
        onPress: async (leave, _, context) => {
          await context?.delete?.(leave.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'types',
        label: 'Tipo',
        type: 'select',
        multiple: true,
        options: Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.entries(LEAVE_STATUS_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'leave-collaborators'],
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
            console.error('[Leave Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'startDate',
        label: 'Data de Início',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
    ],
  },

  search: {
    placeholder: 'Buscar afastamentos...',
    debounce: 500,
  },

  export: {
    title: 'Afastamentos',
    filename: 'afastamentos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'type', label: 'Tipo', path: 'type', format: (value: any): string => value ? LEAVE_TYPE_LABELS[value as LEAVE_TYPE] : '—' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => value ? LEAVE_STATUS_LABELS[value as LEAVE_STATUS] : '—' },
      { key: 'startDate', label: 'Início', path: 'startDate', format: 'date' },
      { key: 'expectedEndDate', label: 'Previsão', path: 'expectedEndDate', format: 'date' },
      { key: 'actualEndDate', label: 'Retorno', path: 'actualEndDate', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Afastamento',
      route: '/departamento-pessoal/medicina/afastamentos/cadastrar',
      canCreate: canEditOccupationalHealth,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'afastamento' : 'afastamentos'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ leaveIds: Array.from(ids) })
        },
        canPerform: canDeleteOccupationalHealth,
      },
    ],
  },
}
