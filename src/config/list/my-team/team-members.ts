import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { CONTRACT_TYPE, CONTRACT_STATUS } from '@/constants/enums'
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from '@/constants/enum-labels'

const getContractLabel = (user: User): string => {
  if (user.currentContractStatus === CONTRACT_STATUS.TERMINATED) return CONTRACT_STATUS_LABELS[CONTRACT_STATUS.TERMINATED]
  return (user.currentContractType ? CONTRACT_TYPE_LABELS[user.currentContractType] : undefined) || user.currentContractType || '-'
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
        key: 'currentContractType',
        label: 'TIPO DE CONTRATO',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (user) => getContractLabel(user),
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
    defaultVisible: ['name', 'position', 'currentContractType'],
    rowHeight: 72,
    actions: [],
    onRowPress: (user: User, router: any) => {
      router.push(`/(tabs)/minha-equipe/membros/detalhes/${user.id}`)
    },
  },

  filters: {
    defaultValues: {
      contractTypes: Object.values(CONTRACT_TYPE),
    },
    fields: [
      {
        key: 'contractTypes',
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
      { key: 'currentContractType', label: 'Tipo de Contrato', path: 'currentContractType', format: (value) => CONTRACT_TYPE_LABELS[value as CONTRACT_TYPE] || value },
      { key: 'phone', label: 'Telefone', path: 'phone' },
    ],
  },

  // No create/edit/delete - team members are managed elsewhere
  actions: undefined,
}
