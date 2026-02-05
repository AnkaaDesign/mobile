import type { ListConfig } from '@/components/list/types'
import type { Payroll } from '@/types'
import { formatCurrency, getCurrentPayrollPeriod } from '@/utils'

// Helper to format month/year
const formatPeriod = (month: number, year: number): string => {
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short' })
  const cleanMonth = monthName.replace('.', '')
  return `${cleanMonth.charAt(0).toUpperCase() + cleanMonth.slice(1)}/${year}`
}

// Helper to get numeric value from Decimal or number
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (value?.toNumber) return value.toNumber()
  return 0
}

// Get current period for default filter
const { year: currentYear, month: currentMonth } = getCurrentPayrollPeriod()

export const payrollListConfig: ListConfig<Payroll> = {
  key: 'hr-payroll',
  title: 'Folha de Pagamento',

  query: {
    hook: 'usePayrollsInfiniteMobile',
    defaultSort: { field: 'user.name', direction: 'asc' },
    pageSize: 25,
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      bonus: {
        include: {
          tasks: true,
          bonusDiscounts: true, bonusExtras: true,
        },
      },
      discounts: true,
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
        render: (payroll) => payroll.user?.name || '—',
        style: { fontWeight: '600' },
      },
      {
        key: 'user.payrollNumber',
        label: 'Nº FOLHA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (payroll) => payroll.user?.payrollNumber?.toString() || '—',
      },
      {
        key: 'user.position.name',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (payroll) => payroll.user?.position?.name || '—',
      },
      {
        key: 'user.sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (payroll) => payroll.user?.sector?.name || '—',
      },
      {
        key: 'performanceLevel',
        label: 'DESEMPENHO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (payroll) => {
          const level = payroll.performanceLevel || payroll.user?.performanceLevel || 0
          return level.toString()
        },
        format: 'badge',
      },
      {
        key: 'baseRemuneration',
        label: 'SALÁRIO BASE',
        sortable: true,
        width: 1.4,
        align: 'right',
        render: (payroll) => formatCurrency(getNumericValue(payroll.baseRemuneration)),
        style: { fontWeight: '500' },
      },
      {
        key: 'bonus.baseBonus',
        label: 'BÔNUS BRUTO',
        sortable: true,
        width: 1.4,
        align: 'right',
        render: (payroll) => {
          const isEligible = payroll.user?.position?.bonifiable
          if (!isEligible) return '—'
          return formatCurrency(getNumericValue(payroll.bonus?.baseBonus))
        },
        style: { fontWeight: '500' },
      },
      {
        key: 'bonus.netBonus',
        label: 'BÔNUS LÍQUIDO',
        sortable: true,
        width: 1.4,
        align: 'right',
        render: (payroll) => {
          const isEligible = payroll.user?.position?.bonifiable
          if (!isEligible) return '—'
          return formatCurrency(getNumericValue(payroll.bonus?.netBonus))
        },
        style: { fontWeight: '600', color: '#22c55e' },
      },
      {
        key: 'totalDiscounts',
        label: 'DESCONTOS',
        sortable: false,
        width: 1.2,
        align: 'right',
        render: (payroll) => {
          const discounts = payroll.discounts || []
          const total = discounts.reduce((sum: number, d: any) => {
            return sum + getNumericValue(d.value)
          }, 0)
          if (total === 0) return '—'
          return formatCurrency(total)
        },
        style: { color: '#ef4444' },
      },
      {
        key: 'netSalary',
        label: 'LÍQUIDO',
        sortable: true,
        width: 1.5,
        align: 'right',
        render: (payroll) => {
          const base = getNumericValue(payroll.baseRemuneration)
          const netBonus = getNumericValue(payroll.bonus?.netBonus)
          const discounts = (payroll.discounts || []).reduce((sum: number, d: any) => {
            return sum + getNumericValue(d.value)
          }, 0)
          const total = base + netBonus - discounts
          return formatCurrency(total)
        },
        style: { fontWeight: '700', color: '#22c55e' },
      },
      {
        key: 'bonus.weightedTasks',
        label: 'TAREFAS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (payroll) => {
          const isEligible = payroll.user?.position?.bonifiable
          if (!isEligible) return '—'
          return getNumericValue(payroll.bonus?.weightedTasks).toFixed(1)
        },
      },
      {
        key: 'bonus.averageTaskPerUser',
        label: 'MÉDIA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (payroll) => {
          const isEligible = payroll.user?.position?.bonifiable
          if (!isEligible) return '—'
          return getNumericValue(payroll.bonus?.averageTaskPerUser).toFixed(2)
        },
      },
      {
        key: 'period',
        label: 'PERÍODO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (payroll) => formatPeriod(payroll.month, payroll.year),
      },
    ],
    defaultVisible: ['user.name', 'netSalary'],
    rowHeight: 56,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (payroll, router) => {
          // Navigate to payroll detail - use live-ID format if no real payroll ID
          const hasRealId = payroll.id && !payroll.id.startsWith('00000000-')
          if (hasRealId) {
            router.push(`/recursos-humanos/folha-de-pagamento/${payroll.id}`)
          } else {
            // Live calculation - use live-{userId}-{year}-{month} format
            const liveId = `live-${payroll.userId}-${payroll.year}-${payroll.month}`
            router.push(`/recursos-humanos/folha-de-pagamento/${liveId}`)
          }
        },
      },
    ],
  },

  filters: {
    defaultValues: {
      year: currentYear.toString(),
      month: [currentMonth.toString()],
    },
    fields: [
      {
        key: 'year',
        label: 'Ano',
        type: 'select',
        multiple: false,
        options: (() => {
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
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'payroll'],
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
    ],
  },

  search: {
    placeholder: 'Buscar colaborador...',
    debounce: 500,
  },

  export: {
    title: 'Folha de Pagamento',
    filename: 'folha-pagamento',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'payrollNumber', label: 'Nº Folha', path: 'user.payrollNumber' },
      { key: 'position', label: 'Cargo', path: 'user.position.name' },
      { key: 'sector', label: 'Setor', path: 'user.sector.name' },
      { key: 'performanceLevel', label: 'Desempenho', path: 'performanceLevel' },
      { key: 'baseRemuneration', label: 'Salário Base', path: 'baseRemuneration', format: 'currency' },
      { key: 'baseBonus', label: 'Bônus Bruto', path: 'bonus.baseBonus', format: 'currency' },
      { key: 'netBonus', label: 'Bônus Líquido', path: 'bonus.netBonus', format: 'currency' },
      { key: 'period', label: 'Período', path: 'month', format: (value: any): string => String(value) },
    ],
  },

  emptyState: {
    icon: 'file-text',
    title: 'Nenhum registro encontrado',
    description: 'Não há folhas de pagamento para o período selecionado',
  },
}
