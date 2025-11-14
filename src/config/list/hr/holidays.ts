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
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
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
    sections: [
      {
        key: 'type',
        label: 'Tipo',
        icon: 'calendar-event',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'type',
            label: 'Tipo de Feriado',
            type: 'select',
            multiple: true,
            options: Object.values(HOLIDAY_TYPE).map((type) => ({
              label: TYPE_LABELS[type],
              value: type,
            })),
            placeholder: 'Selecione os tipos',
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
            key: 'date',
            label: 'Data do Feriado',
            type: 'date-range',
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
