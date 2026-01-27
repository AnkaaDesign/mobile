import type { ListConfig } from '@/components/list/types'
import type { Bonus } from '@/types'
import { BONUS_STATUS, BONUS_STATUS_LABELS } from '@/constants'
import { routes } from '@/constants'
import { routeToMobilePath } from '@/utils/route-mapper'

// Helper function to get Portuguese month name from month number (1-12)
const getMonthLabel = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1] || '-'
}

// Helper to get numeric value from Decimal or number
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value?.toNumber) return value.toNumber();
  return 0;
}

// Helper to format bonus amount (handles Decimal type from Prisma)
const formatBonusAmount = (amount: any): string => {
  const value = getNumericValue(amount);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Helper to format decimal values
const formatDecimal = (value: any): string => {
  return getNumericValue(value).toFixed(2);
}

export const personalBonusesListConfig: ListConfig<Bonus> = {
  key: 'personal-bonuses',
  title: 'Meus Bônus',

  query: {
    hook: 'useMyBonusesInfiniteMobile',
    defaultSort: [
      { field: 'year', direction: 'desc' },
      { field: 'month', direction: 'desc' },
    ],
    pageSize: 25,
  },

  table: {
    columns: [
      {
        key: 'status',
        label: 'STATUS',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (bonus) => {
          // @ts-ignore - isLive is dynamically added
          return bonus.isLive ? 'Provisório' : 'Confirmado'
        },
        format: 'badge',
        component: 'status-badge',
      },
      {
        key: 'period',
        label: 'PERÍODO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (bonus) => {
          const monthName = getMonthLabel(bonus.month)
          return `${monthName}/${bonus.year}`
        },
        style: { fontWeight: '500' },
      },
      {
        key: 'netBonus',
        label: 'VALOR',
        sortable: true,
        width: 1.3,
        align: 'right',
        render: (bonus) => formatBonusAmount(bonus.netBonus),
        style: { fontWeight: '600' },
      },
      {
        key: 'performanceLevel',
        label: 'NÍVEL',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => `Nível ${bonus.performanceLevel}`,
        format: 'badge',
      },
      {
        key: 'weightedTasks',
        label: 'TAREFAS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => formatDecimal(bonus.weightedTasks),
      },
      {
        key: 'averageTaskPerUser',
        label: 'MÉDIA/COLAB.',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => formatDecimal(bonus.averageTaskPerUser),
      },
      {
        key: 'discounts',
        label: 'DESCONTOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (bonus) => {
          // Calculate discounts as baseBonus - netBonus
          const baseBonus = getNumericValue(bonus.baseBonus)
          const netBonus = getNumericValue(bonus.netBonus)
          const totalDiscounts = baseBonus - netBonus
          if (totalDiscounts <= 0) return '-'
          return formatBonusAmount(totalDiscounts)
        },
        style: { color: '#ef4444' },
      },
      {
        key: 'calculationPeriod',
        label: 'PERÍODO CÁLCULO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (bonus) => {
          if (!bonus.calculationPeriodStart || !bonus.calculationPeriodEnd) return '-'
          const start = new Date(bonus.calculationPeriodStart).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
          })
          const end = new Date(bonus.calculationPeriodEnd).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
          })
          return `${start} - ${end}`
        },
      },
      {
        key: 'user.position.name',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (bonus) => bonus.user?.position?.name || '-',
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
    defaultVisible: ['period', 'baseBonus', 'weightedTasks'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (bonus, router) => {
          // @ts-ignore - isLive is dynamically added
          if (bonus.isLive) {
            // Navigate to current bonus page for live bonus
            router.push('/(tabs)/pessoal/meu-bonus' as any)
          } else {
            // Navigate to details for saved bonus
            router.push(`/(tabs)/pessoal/meu-bonus/detalhes/${bonus.id}` as any)
          }
        },
      },
    ],
    onRowPress: (bonus, router) => {
      // @ts-ignore - isLive is dynamically added
      if (bonus.isLive) {
        // Navigate to current bonus page for live bonus
        router.push('/(tabs)/pessoal/meu-bonus' as any)
      } else {
        // Navigate to details for saved bonus
        router.push(`/(tabs)/pessoal/meu-bonus/detalhes/${bonus.id}` as any)
      }
    },
  },

  filters: {
    fields: [
      {
        key: 'year',
        label: 'Ano',
        type: 'select',
        multiple: false,
        options: Array.from({ length: 5 }, (_, i) => {
          const year = new Date().getFullYear() - 2 + i
          return { label: year.toString(), value: year }
        }),
        placeholder: 'Selecione o ano',
      },
      {
        key: 'month',
        label: 'Mês',
        type: 'select',
        multiple: false,
        options: Array.from({ length: 12 }, (_, i) => ({
          label: getMonthLabel(i + 1),
          value: i + 1,
        })),
        placeholder: 'Selecione o mês',
      },
      {
        key: 'performanceLevel',
        label: 'Nível de Performance',
        type: 'select',
        multiple: true,
        options: [1, 2, 3, 4, 5].map(level => ({
          label: `Nível ${level}`,
          value: level,
        })),
        placeholder: 'Selecione o nível',
      },
    ],
  },

  search: {
    placeholder: 'Buscar bônus por período...',
    debounce: 300,
  },

  export: {
    title: 'Meus Bônus',
    filename: 'meus-bonus',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      {
        key: 'period',
        label: 'Período',
        format: (_, bonus) => {
          const monthName = getMonthLabel(bonus.month)
          return `${monthName}/${bonus.year}`
        }
      },
      {
        key: 'baseBonus',
        label: 'Valor Bruto',
        path: 'baseBonus',
        format: (value) => formatBonusAmount(value)
      },
      {
        key: 'netBonus',
        label: 'Valor Líquido',
        path: 'netBonus',
        format: (value) => formatBonusAmount(value)
      },
      {
        key: 'performanceLevel',
        label: 'Nível de Performance',
        path: 'performanceLevel'
      },
      {
        key: 'weightedTasks',
        label: 'Tarefas Ponderadas',
        path: 'weightedTasks',
        format: (value) => formatDecimal(value)
      },
      {
        key: 'averageTaskPerUser',
        label: 'Média por Colaborador',
        path: 'averageTaskPerUser',
        format: (value) => formatDecimal(value)
      },
      {
        key: 'position',
        label: 'Cargo',
        path: 'user.position.name'
      },
      {
        key: 'createdAt',
        label: 'Criado Em',
        path: 'createdAt',
        format: 'date'
      },
    ],
  },

  // No create/edit/delete for personal bonuses - read-only view

  emptyState: {
    icon: 'currency-dollar',
    title: 'Nenhum bônus encontrado',
    description: 'Você não possui bônus cadastrados',
  },
}
