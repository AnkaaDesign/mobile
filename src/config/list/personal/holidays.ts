import type { ListConfig } from '@/components/list/types'
import type { Holiday } from '@/types'

export const personalHolidaysListConfig: ListConfig<Holiday> = {
  key: 'personal-holidays',
  title: 'Feriados',

  query: {
    hook: 'useHolidaysInfiniteMobile',
    defaultSort: { field: 'date', direction: 'desc' },
    pageSize: 25,
    include: {},
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (holiday) => holiday.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'date',
        label: 'DATA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (holiday) => holiday.date,
        format: 'date',
      },
      {
        key: 'dayOfWeek',
        label: 'DIA DA SEMANA',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (holiday) => {
          if (!holiday.date) return '-'
          const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          return days[new Date(holiday.date).getDay()]
        },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: false,
        width: 1.5,
        align: 'center',
        render: (holiday) => {
          if (!holiday.date) return '-'

          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const holidayDate = new Date(holiday.date)
          holidayDate.setHours(0, 0, 0, 0)

          const diffTime = holidayDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays < 0) return 'Passado'
          if (diffDays === 0) return 'Hoje'
          if (diffDays === 1) return 'Amanhã'
          if (diffDays < 7) return `Em ${diffDays} dias`
          if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7)
            return weeks === 1 ? 'Em 1 semana' : `Em ${weeks} semanas`
          }
          const months = Math.floor(diffDays / 30)
          return months === 1 ? 'Em 1 mês' : `Em ${months} meses`
        },
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (holiday) => holiday.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'date', 'dayOfWeek'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'year',
        type: 'select',
        multiple: false,
        options: Array.from({ length: 5 }, (_, i) => {
          const year = new Date().getFullYear() - 1 + i
          return { label: year.toString(), value: year }
        }),
        placeholder: 'Selecione o ano',
      },
      {
        key: 'month',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Janeiro', value: 1 },
          { label: 'Fevereiro', value: 2 },
          { label: 'Março', value: 3 },
          { label: 'Abril', value: 4 },
          { label: 'Maio', value: 5 },
          { label: 'Junho', value: 6 },
          { label: 'Julho', value: 7 },
          { label: 'Agosto', value: 8 },
          { label: 'Setembro', value: 9 },
          { label: 'Outubro', value: 10 },
          { label: 'Novembro', value: 11 },
          { label: 'Dezembro', value: 12 },
        ],
        placeholder: 'Selecione o mês',
      },
    ],
  },

  search: {
    placeholder: 'Buscar feriados...',
    debounce: 300,
  },

  export: {
    title: 'Feriados',
    filename: 'feriados',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'date', label: 'Data', path: 'date', format: 'date' },
    ],
  },

  // No create/edit/delete for personal holidays - read-only view
  actions: undefined,

  emptyState: {
    icon: 'calendar',
    title: 'Nenhum feriado encontrado',
    description: 'Não há feriados cadastrados',
  },
}
