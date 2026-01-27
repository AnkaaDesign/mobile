import type { ListConfig } from '@/components/list/types'
import type { Bonus } from '@/types'
import { formatCurrency } from '@/utils'
import { badgeColors } from '@/lib/theme/extended-colors'

// Helper to format month/year
const formatPeriod = (month: number, year: number): string => {
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short' })
  const cleanMonth = monthName.replace('.', '')
  return `${cleanMonth.charAt(0).toUpperCase() + cleanMonth.slice(1)}/${year}`
}

// Helper to get performance level color
const getPerformanceLevelColor = (level: number) => {
  if (level >= 4) return badgeColors.success
  if (level >= 3) return badgeColors.info
  if (level >= 2) return badgeColors.warning
  if (level === 1) return badgeColors.error
  return badgeColors.muted
}

// Helper to get numeric value from Decimal or number
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value?.toNumber) return value.toNumber();
  return 0;
}

export const bonusesListConfig: ListConfig<Bonus> = {
  key: 'hr-bonuses',
  title: 'Bônus',

  query: {
    hook: 'useBonusesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      bonusDiscounts: true, bonusExtras: true,
    },
  },

  table: {
    columns: [
      {
        key: 'period',
        label: 'PERÍODO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (bonus) => formatPeriod(bonus.month, bonus.year),
        style: { fontWeight: '500' },
      },
      {
        key: 'user.name',
        label: 'COLABORADOR',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (bonus) => bonus.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'user.payrollNumber',
        label: 'Nº FOLHA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (bonus) => bonus.user?.payrollNumber?.toString() || '—',
      },
      {
        key: 'user.position.name',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (bonus) => bonus.user?.position?.name || '—',
        format: 'badge',
      },
      {
        key: 'user.sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (bonus) => bonus.user?.sector?.name || '—',
      },
      {
        key: 'performanceLevel',
        label: 'DESEMPENHO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => bonus.performanceLevel?.toString() || '0',
        format: 'badge',
        badge: (bonus) => ({
          variant: 'default',
          color: getPerformanceLevelColor(bonus.performanceLevel || 0),
        }),
      },
      {
        key: 'weightedTasks',
        label: 'TAREFAS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => getNumericValue(bonus.weightedTasks).toFixed(1),
      },
      {
        key: 'averageTaskPerUser',
        label: 'MÉDIA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => getNumericValue(bonus.averageTaskPerUser).toFixed(2),
      },
      {
        key: 'baseBonus',
        label: 'BÔNUS BRUTO',
        sortable: true,
        width: 1.5,
        align: 'right',
        render: (bonus) => formatCurrency(getNumericValue(bonus.baseBonus)),
        style: { fontWeight: '600' },
      },
      {
        key: 'discounts',
        label: 'DESCONTOS',
        sortable: false,
        width: 1.2,
        align: 'right',
        render: (bonus) => {
          // Calculate discounts as baseBonus - netBonus (simpler and more accurate)
          const baseBonus = getNumericValue(bonus.baseBonus)
          const netBonus = getNumericValue(bonus.netBonus)
          const totalDiscounts = baseBonus - netBonus
          return formatCurrency(totalDiscounts)
        },
        style: { color: '#ef4444' },
      },
      {
        key: 'netBonus',
        label: 'BÔNUS LÍQUIDO',
        sortable: true,
        width: 1.5,
        align: 'right',
        render: (bonus) => formatCurrency(getNumericValue(bonus.netBonus)),
        style: { fontWeight: '700', color: '#22c55e' },
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (bonus) => bonus.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'user.position.name', 'netBonus'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (bonus, router) => {
          router.push(`/recursos-humanos/bonus/detalhes/${bonus.id}`)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'year',
        label: 'Ano',
        type: 'select',
        multiple: false,
        options: (() => {
          const currentYear = new Date().getFullYear()
          const years = []
          for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ label: y.toString(), value: y.toString() })
          }
          return years
        })(),
        placeholder: 'Selecione o ano',
      },
      {
        key: 'month',
        label: 'Mês',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Janeiro', value: '1' },
          { label: 'Fevereiro', value: '2' },
          { label: 'Março', value: '3' },
          { label: 'Abril', value: '4' },
          { label: 'Maio', value: '5' },
          { label: 'Junho', value: '6' },
          { label: 'Julho', value: '7' },
          { label: 'Agosto', value: '8' },
          { label: 'Setembro', value: '9' },
          { label: 'Outubro', value: '10' },
          { label: 'Novembro', value: '11' },
          { label: 'Dezembro', value: '12' },
        ],
        placeholder: 'Selecione o mês',
      },
      {
        key: 'performanceLevel',
        label: 'Nível de Desempenho',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
        min: 0,
        max: 5,
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'bonus'],
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
            console.error('[User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
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
    ],
  },

  search: {
    placeholder: 'Buscar bônus...',
    debounce: 300,
  },

  export: {
    title: 'Bônus',
    filename: 'bonus',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'period', label: 'Período', path: 'month', format: (value, item) => formatPeriod(item.month, item.year) },
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'payrollNumber', label: 'Nº Folha', path: 'user.payrollNumber' },
      { key: 'position', label: 'Cargo', path: 'user.position.name' },
      { key: 'sector', label: 'Setor', path: 'user.sector.name' },
      { key: 'performanceLevel', label: 'Desempenho', path: 'performanceLevel' },
      { key: 'weightedTasks', label: 'Tarefas', path: 'weightedTasks', format: (value) => getNumericValue(value).toFixed(1) },
      { key: 'averageTaskPerUser', label: 'Média', path: 'averageTaskPerUser', format: (value) => getNumericValue(value).toFixed(2) },
      { key: 'baseBonus', label: 'Bônus Bruto', path: 'baseBonus', format: (value) => formatCurrency(getNumericValue(value)) },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  emptyState: {
    icon: 'gift',
    title: 'Nenhum bônus encontrado',
    description: 'Não há bônus cadastrados para o período selecionado',
  },
}
