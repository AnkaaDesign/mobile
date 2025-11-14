import type { ListConfig } from '@/components/list/types'
import type { Vacation } from '@/types'
import {
  VACATION_STATUS,
  VACATION_TYPE,
  VACATION_STATUS_LABELS,
  VACATION_TYPE_LABELS,
} from '@/constants'

export const personalVacationsListConfig: ListConfig<Vacation> = {
  key: 'personal-vacations',
  title: 'Minhas Férias',

  query: {
    hook: 'useVacationsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      approvedBy: true,
    },
  },

  table: {
    columns: [
      {
        key: 'period',
        label: 'PERÍODO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (vacation) => {
          if (!vacation.startAt || !vacation.endAt) return '-'
          return `${new Date(vacation.startAt).toLocaleDateString()} - ${new Date(vacation.endAt).toLocaleDateString()}`
        },
        style: { fontWeight: '500' },
      },
      {
        key: 'daysRequested',
        label: 'DIAS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (vacation) => vacation.daysRequested || 0,
        format: 'number',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (vacation) => vacation.status,
        format: 'badge',
        component: 'status-badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (vacation) => vacation.type ? VACATION_TYPE_LABELS[vacation.type] : '-',
        format: 'badge',
      },
      {
        key: 'isCollective',
        label: 'COLETIVO',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (vacation) => vacation.isCollective ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'observation',
        label: 'OBSERVAÇÃO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (vacation) => vacation.observation || '-',
      },
      {
        key: 'approvedBy.name',
        label: 'APROVADO POR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (vacation) => vacation.approvedBy?.name || '-',
      },
      {
        key: 'createdAt',
        label: 'SOLICITADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (vacation) => vacation.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['period', 'daysRequested', 'status'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (vacation, router) => {
          router.push(`/pessoal/minhas-ferias/detalhes/${vacation.id}` as any)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'check-circle',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            multiple: false,
            options: Object.values(VACATION_STATUS).map((status) => ({
              label: VACATION_STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione o status',
          },
        ],
      },
      {
        key: 'type',
        label: 'Tipo',
        icon: 'tag',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'type',
            label: 'Tipo de Férias',
            type: 'select',
            multiple: true,
            options: Object.values(VACATION_TYPE).map((type) => ({
              label: VACATION_TYPE_LABELS[type],
              value: type,
            })),
            placeholder: 'Selecione os tipos',
          },
          {
            key: 'isCollective',
            label: 'Apenas Férias Coletivas',
            type: 'toggle',
            description: 'Mostrar apenas férias coletivas',
          },
        ],
      },
      {
        key: 'dates',
        label: 'Período',
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
              const year = new Date().getFullYear() - 2 + i
              return { label: year.toString(), value: year }
            }),
            placeholder: 'Selecione o ano',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar férias...',
    debounce: 300,
  },

  export: {
    title: 'Minhas Férias',
    filename: 'minhas-ferias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'startAt', label: 'Início', path: 'startAt', format: 'date' },
      { key: 'endAt', label: 'Fim', path: 'endAt', format: 'date' },
      { key: 'daysRequested', label: 'Dias Solicitados', path: 'daysRequested', format: 'number' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => VACATION_STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => value ? VACATION_TYPE_LABELS[value] : '-' },
      { key: 'isCollective', label: 'Coletivo', path: 'isCollective', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'observation', label: 'Observação', path: 'observation' },
      { key: 'approvedBy', label: 'Aprovado Por', path: 'approvedBy.name' },
      { key: 'createdAt', label: 'Solicitado Em', path: 'createdAt', format: 'date' },
    ],
  },

  // No create/edit/delete for personal vacations - read-only view
  actions: undefined,

  emptyState: {
    icon: 'calendar',
    title: 'Nenhuma férias encontrada',
    description: 'Você não possui férias cadastradas',
  },
}
