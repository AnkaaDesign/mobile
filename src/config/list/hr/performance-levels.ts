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
        width: 1.5,
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
        label: 'NÍVEL',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (user) => {
          const level = user.performanceLevel || 0
          return getPerformanceLevelLabel(level)
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
        type: 'number-range',
        placeholder: { min: 'Nível mínimo', max: 'Nível máximo' },
        min: 0,
        max: 5,
      },
      {
        key: 'status',
        type: 'select',
        multiple: true,
        options: Object.values(USER_STATUS).map((status) => ({
          label: USER_STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Status do funcionário',
      },
      {
        key: 'isActive',
        type: 'toggle',
        placeholder: 'Apenas ativos',
      },
      {
        key: 'positionIds',
        type: 'select',
        multiple: true,
        placeholder: 'Cargos',
      },
      {
        key: 'sectorIds',
        type: 'select',
        multiple: true,
        placeholder: 'Setores',
      },
    ],
  },

  search: {
    placeholder: 'Buscar funcionários...',
    debounce: 300,
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
