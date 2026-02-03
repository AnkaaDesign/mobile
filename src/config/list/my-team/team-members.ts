import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { USER_STATUS } from '@/constants/enums'


const STATUS_LABELS: Record<string, string> = {
  EXPERIENCE_PERIOD_1: 'Experiência 1',
  EXPERIENCE_PERIOD_2: 'Experiência 2',
  EFFECTED: 'Efetivado',
  DISMISSED: 'Desligado',
}

export const teamMembersListConfig: ListConfig<User> = {
  key: 'my-team-members',
  title: 'Membros da Equipe',

  query: {
    hook: 'useUsersInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      position: true,
      sector: true,
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'email',
        label: 'EMAIL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.email || '-',
      },
      {
        key: 'position',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.position?.name || '-',
      },
      {
        key: 'sector',
        label: 'SETOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (user) => user.sector?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (user) => STATUS_LABELS[user.status] || user.status,
        format: 'badge',
        badgeEntity: 'USER',
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 1.3,
        align: 'left',
        render: (user) => user.phone || '-',
      },
    ],
    defaultVisible: ['name', 'position', 'status'],
    rowHeight: 72,
    actions: [],
    onRowPress: (user: User, router: any) => {
      router.push(`/(tabs)/minha-equipe/membros/detalhes/${user.id}`)
    },
  },

  filters: {
    defaultValues: {
      statuses: [USER_STATUS.EFFECTED, USER_STATUS.EXPERIENCE_PERIOD_1, USER_STATUS.EXPERIENCE_PERIOD_2],
    },
    fields: [
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(USER_STATUS).map((status) => ({
          label: STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'positionIds',
        label: 'Cargos',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['positions', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getPositions } = await import('@/api-client')
            const pageSize = 20
            const response = await getPositions({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((position: any) => ({
                label: position.name,
                value: position.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Position Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os cargos',
      },
      {
        key: 'sectorIds',
        label: 'Setores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['sectors', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getSectors } = await import('@/api-client')
            const pageSize = 20
            const response = await getSectors({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((sector: any) => ({
                label: sector.name,
                value: sector.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Sector Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os setores',
      },
      {
        key: 'birth',
        label: 'Data de Nascimento',
        type: 'date-range',
        placeholder: 'Data de Nascimento',
      },
      {
        key: 'dismissedAt',
        label: 'Data de Demissão',
        type: 'date-range',
        placeholder: 'Data de Demissão',
      },
      {
        key: 'exp1EndAt',
        label: 'Data de Contratação',
        type: 'date-range',
        placeholder: 'Data de Contratação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar membros...',
    debounce: 500,
  },

  export: {
    title: 'Membros da Equipe',
    filename: 'membros-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'phone', label: 'Telefone', path: 'phone' },
    ],
  },

  // No create/edit/delete - team members are managed elsewhere
  actions: undefined,
}
