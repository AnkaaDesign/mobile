import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import {
  USER_STATUS,
  USER_STATUS_LABELS,
} from '@/constants'
import { badgeColors } from '@/lib/theme/extended-colors'

// Performance level display helpers
const getPerformanceLevelLabel = (level: number): string => {
  if (level >= 4) return 'Excelente'
  if (level >= 3) return 'Bom'
  if (level >= 2) return 'Regular'
  if (level === 1) return 'Ruim'
  return 'Não Avaliado'
}

const getPerformanceLevelColor = (level: number) => {
  if (level >= 4) return badgeColors.success
  if (level >= 3) return badgeColors.info
  if (level >= 2) return badgeColors.warning
  if (level === 1) return badgeColors.error
  return badgeColors.muted
}

const getMultiplierPercentage = (level: number): string => {
  const multipliers: Record<number, number> = {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 350,
    5: 400,
  }
  return `${multipliers[level] || 0}%`
}

export const performanceLevelsListConfig: ListConfig<User> = {
  key: 'hr-performance-levels',
  title: 'Níveis de Performance',

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
        width: 1.8,
        align: 'left',
        render: (user) => user.email || '-',
      },
      {
        key: 'position.name',
        label: 'CARGO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.position?.name || '-',
        format: 'badge',
      },
      {
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.sector?.name || '-',
      },
      {
        key: 'performanceLevel',
        label: 'DESEMPENHO',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (user) => {
          const level = user.performanceLevel || 0
          return level.toString()
        },
        format: 'badge',
        badge: (user) => {
          const level = user.performanceLevel || 0
          return {
            variant: 'default',
            color: getPerformanceLevelColor(level),
          }
        },
      },
      {
        key: 'multiplier',
        label: 'MULTIPLICADOR',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (user) => getMultiplierPercentage(user.performanceLevel || 0),
        format: 'badge',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (user) => USER_STATUS_LABELS[user.status] || user.status,
        format: 'badge',
      },
    ],
    defaultVisible: ['name', 'position.name', 'performanceLevel'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'performanceLevel',
        label: 'Nível de Performance',
        type: 'number-range',
        placeholder: { min: 'Nível mínimo', max: 'Nível máximo' },
        min: 0,
        max: 5,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(USER_STATUS).map((status) => ({
          label: USER_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'isActive',
        label: 'Apenas Ativos',
        type: 'toggle',
        placeholder: 'Apenas ativos',
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
    ],
  },

  search: {
    placeholder: 'Buscar funcionários...',
    debounce: 500,
  },

  export: {
    title: 'Níveis de Performance',
    filename: 'niveis-de-performance',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      {
        key: 'performanceLevel',
        label: 'Nível de Performance',
        path: 'performanceLevel',
        format: (value) => {
          const level = Number(value) || 0
          return `${getPerformanceLevelLabel(level)} (${level})`
        }
      },
      {
        key: 'multiplier',
        label: 'Multiplicador',
        path: 'performanceLevel',
        format: (value) => getMultiplierPercentage(Number(value) || 0)
      },
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => USER_STATUS_LABELS[value as USER_STATUS] || value
      },
    ],
  },

  emptyState: {
    icon: 'trophy',
    title: 'Nenhum funcionário encontrado',
    description: 'Não há funcionários cadastrados no sistema',
  },
}
