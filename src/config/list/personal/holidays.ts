import type { ListConfig } from '@/components/list/types'
import type { Holiday } from '@/types'
import { HOLIDAY_TYPE, HOLIDAY_TYPE_LABELS } from '@/constants'

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
        align: 'center',
        render: (holiday) => {
          if (!holiday.date) return '-'
          const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          return days[new Date(holiday.date).getDay()]
        },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (holiday) => holiday.type ? HOLIDAY_TYPE_LABELS[holiday.type] : '-',
        format: 'badge',
      },
      {
        key: 'isRecurring',
        label: 'RECORRENTE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (holiday) => holiday.isRecurring ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (holiday) => holiday.description || '-',
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
    defaultVisible: ['name', 'date', 'dayOfWeek', 'type'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (holiday, router) => {
          router.push(`/pessoal/meus-feriados/detalhes/${holiday.id}` as any)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'type',
        label: 'Tipo',
        icon: 'tag',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'type',
            label: 'Tipo de Feriado',
            type: 'select',
            multiple: true,
            options: Object.values(HOLIDAY_TYPE).map((type) => ({
              label: HOLIDAY_TYPE_LABELS[type],
              value: type,
            })),
            placeholder: 'Selecione os tipos',
          },
          {
            key: 'isRecurring',
            label: 'Apenas Recorrentes',
            type: 'toggle',
            description: 'Mostrar apenas feriados recorrentes',
          },
        ],
      },
      {
        key: 'dates',
        label: 'Datas',
        icon: 'calendar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'year',
            label: 'Ano',
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
            label: 'Mês',
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
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => value ? HOLIDAY_TYPE_LABELS[value] : '-' },
      { key: 'isRecurring', label: 'Recorrente', path: 'isRecurring', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
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
