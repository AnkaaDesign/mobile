import type { ListConfig } from '@/components/list/types'
import type { Holiday } from '@/types'

export const holidaysListConfig: ListConfig<Holiday> = {
  key: 'hr-holidays',
  title: 'Feriados',

  query: {
    hook: 'useHolidaysInfiniteMobile',
    defaultSort: { field: 'date', direction: 'asc' },
    pageSize: 25,
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
    ],
    defaultVisible: ['name', 'date', 'dayOfWeek'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (holiday, router) => {
          router.push(`/recursos-humanos/feriados/detalhes/${holiday.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (holiday, router) => {
          router.push(`/recursos-humanos/feriados/editar/${holiday.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (holiday) => `Deseja excluir o feriado "${holiday.name}"?`,
        },
        onPress: async (holiday, _, { delete: deleteHoliday }) => {
          await deleteHoliday(holiday.id)
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
          return Array.from({ length: 5 }, (_, i) => {
            const year = currentYear - 1 + i
            return { label: String(year), value: year }
          })
        })(),
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

  search: {
    placeholder: 'Buscar feriados...',
    debounce: 500,
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

  actions: {
    create: {
      label: 'Cadastrar Feriado',
      route: '/recursos-humanos/feriados/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'feriado' : 'feriados'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
