import type { ListConfig } from '@/components/list/types'
import type { Holiday } from '@/types'
import { HOLIDAY_TYPE } from '@/constants/enums'

const TYPE_LABELS: Record<string, string> = {
  NATIONAL: 'Nacional',
  STATE: 'Estadual',
  MUNICIPAL: 'Municipal',
  OPTIONAL: 'Facultativo',
}

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
        width: 2.5,
        align: 'left',
        render: (holiday) => holiday.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'date',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (holiday) => holiday.date,
        format: 'date',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (holiday) => holiday.type,
        format: 'badge',
      },
    ],
    defaultVisible: ['name', 'date', 'type'],
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
        type: 'select',
        multiple: false,
        options: (() => {
          const currentYear = new Date().getFullYear()
          return Array.from({ length: 5 }, (_, i) => {
            const year = currentYear - 2 + i
            return { label: String(year), value: year }
          })
        })(),
        placeholder: 'Ano',
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
        placeholder: 'Mês',
      },
      {
        key: 'type',
        type: 'select',
        multiple: true,
        options: Object.values(HOLIDAY_TYPE).map((type) => ({
          label: TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Tipo de feriado',
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
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => TYPE_LABELS[value] || value },
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
