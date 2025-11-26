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

// Helper to format bonus amount (handles Decimal type from Prisma)
const formatBonusAmount = (amount: any): string => {
  console.log('💰 formatBonusAmount input:', { amount, type: typeof amount, constructor: amount?.constructor?.name });

  let value = 0;

  if (amount === null || amount === undefined) {
    value = 0;
  } else if (typeof amount === 'number') {
    value = amount;
  } else if (typeof amount === 'string') {
    value = parseFloat(amount) || 0;
  } else if (amount?.toNumber) {
    value = amount.toNumber();
  } else if (amount?.$numberDecimal) {
    // MongoDB Decimal128 format
    value = parseFloat(amount.$numberDecimal) || 0;
  } else if (typeof amount === 'object') {
    // Try to extract any numeric value
    console.log('⚠️ Unknown object format:', JSON.stringify(amount));
    value = 0;
  }

  console.log('💰 formatBonusAmount output:', value);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Helper to format decimal values
const formatDecimal = (value: any): string => {
  let num = 0;

  if (value === null || value === undefined) {
    num = 0;
  } else if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value) || 0;
  } else if (value?.toNumber) {
    num = value.toNumber();
  } else if (value?.$numberDecimal) {
    num = parseFloat(value.$numberDecimal) || 0;
  }

  return num.toFixed(2);
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
        key: 'baseBonus',
        label: 'VALOR',
        sortable: true,
        width: 1.3,
        align: 'right',
        render: (bonus) => formatBonusAmount(bonus.baseBonus),
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
        key: 'ponderedTaskCount',
        label: 'TAREFAS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => formatDecimal(bonus.ponderedTaskCount),
      },
      {
        key: 'averageTasksPerUser',
        label: 'MÉDIA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (bonus) => formatDecimal(bonus.averageTasksPerUser),
      },
      {
        key: 'discounts',
        label: 'DESCONTOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (bonus) => {
          if (!bonus.bonusDiscounts || bonus.bonusDiscounts.length === 0) {
            return '-'
          }
          return `${bonus.bonusDiscounts.length}`
        },
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
    defaultVisible: ['period', 'baseBonus', 'ponderedTaskCount'],
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
            // Navigate to simulation for live bonus
            router.push(routeToMobilePath(routes.personal.myBonuses.simulation) as any)
          } else {
            // Navigate to details for saved bonus
            router.push(routeToMobilePath(routes.personal.myBonuses.details(bonus.id)) as any)
          }
        },
      },
    ],
    onRowPress: (bonus, router) => {
      // @ts-ignore - isLive is dynamically added
      if (bonus.isLive) {
        router.push(routeToMobilePath(routes.personal.myBonuses.simulation) as any)
      } else {
        router.push(routeToMobilePath(routes.personal.myBonuses.details(bonus.id)) as any)
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
        label: 'Valor Base',
        path: 'baseBonus',
        format: (value) => formatBonusAmount(value)
      },
      {
        key: 'performanceLevel',
        label: 'Nível de Performance',
        path: 'performanceLevel'
      },
      {
        key: 'ponderedTaskCount',
        label: 'Tarefas Ponderadas',
        path: 'ponderedTaskCount',
        format: (value) => formatDecimal(value)
      },
      {
        key: 'averageTasksPerUser',
        label: 'Média por Usuário',
        path: 'averageTasksPerUser',
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
  // But add simulation button in toolbar
  actions: {
    toolbar: [
      {
        key: 'simulation',
        icon: 'calculator',
        variant: 'primary',
        onPress: (router) => {
          router.push('/(tabs)/pessoal/simulacao-bonus' as any)
        },
      },
    ],
  },

  emptyState: {
    icon: 'currency-dollar',
    title: 'Nenhum bônus encontrado',
    description: 'Você não possui bônus cadastrados',
  },
}
