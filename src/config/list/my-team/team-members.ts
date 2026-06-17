import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { CONTRACT_TYPE } from '@/constants/enums'
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from '@/constants/enum-labels'

// Lifecycle status (Ativo / Em experiência / Aviso prévio / Afastado / Desligado)
// derived from the current vínculo status cache.
const getStatusLabel = (user: User): string => {
  return (user.currentContractStatus ? CONTRACT_STATUS_LABELS[user.currentContractStatus] : undefined) || '-'
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
        key: 'currentContractStatus',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (user) => getStatusLabel(user),
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
    defaultVisible: ['name', 'position', 'currentContractStatus'],
    rowHeight: 72,
    actions: [],
    onRowPress: (user: User, router: any) => {
      router.push(`/(tabs)/minha-equipe/membros/detalhes/${user.id}`)
    },
  },

  filters: {
    defaultValues: {
      // contractKinds is the API convenience filter that maps to currentContractType.
      contractKinds: Object.values(CONTRACT_TYPE),
    },
    fields: [
      {
        key: 'contractKinds',
        label: 'Tipo de Contrato',
        type: 'select',
        multiple: true,
        options: Object.values(CONTRACT_TYPE).map((type) => ({
          label: CONTRACT_TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos de contrato',
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
      // NOTE: "Data de Demissão" (dismissedAt) and "Data de Contratação"
      // (exp1EndAt) date-range filters were removed: those dates moved onto the
      // EmploymentContract and the API exposes no convenience filter for them.
      // This list framework only sends verbatim top-level params, so it cannot
      // express the nested `where: { currentContract: { is: {...} } }` form the
      // API requires. Re-add only if/when a nested-where filter type is added.
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
      { key: 'currentContractType', label: 'Tipo de Contrato', path: 'currentContractType', format: (value) => CONTRACT_TYPE_LABELS[value as CONTRACT_TYPE] || value },
      { key: 'phone', label: 'Telefone', path: 'phone' },
    ],
  },

  // No create/edit/delete - team members are managed elsewhere
  actions: undefined,
}
