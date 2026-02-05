import type { ListConfig } from '@/components/list/types'
import type { Vacation } from '@/types'
import { VACATION_STATUS, VACATION_TYPE } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
}

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Anual',
  COLLECTIVE: 'Coletivo',
  MEDICAL: 'Médico',
  MATERNITY: 'Maternidade',
  PATERNITY: 'Paternidade',
  EMERGENCY: 'Emergência',
  STUDY: 'Estudo',
  UNPAID: 'Não Remunerado',
  OTHER: 'Outro',
}

export const teamVacationsListConfig: ListConfig<Vacation> = {
  key: 'my-team-vacations',
  title: 'Férias da Equipe',

  query: {
    hook: 'useTeamVacationsInfiniteMobile',
    defaultSort: { field: 'startAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
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
        render: (vacation) => vacation.user?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'user.position.name',
        label: 'CARGO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (vacation) => vacation.user?.position?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.3,
        align: 'center',
        render: (vacation) => STATUS_LABELS[vacation.status] || vacation.status,
        format: 'badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (vacation) => vacation.type ? TYPE_LABELS[vacation.type] : '-',
        format: 'badge',
      },
      {
        key: 'startAt',
        label: 'INÍCIO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (vacation) => vacation.startAt || '-',
        format: 'date',
      },
      {
        key: 'endAt',
        label: 'FIM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (vacation) => vacation.endAt,
        format: 'date',
      },
      {
        key: 'days',
        label: 'DIAS',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (vacation) => {
          const startAt = new Date(vacation.startAt)
          const endAt = new Date(vacation.endAt)
          const days = Math.ceil((endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
          return String(days || 0)
        },
        format: 'number',
      },
    ],
    defaultVisible: ['user.name', 'status', 'startAt'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.values(VACATION_STATUS).map((status) => ({
          label: STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'types',
        label: 'Tipo de Férias',
        type: 'select',
        multiple: true,
        options: Object.values(VACATION_TYPE).map((type) => ({
          label: TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'startAt',
        label: 'Data de Início',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
      {
        key: 'endAt',
        label: 'Data de Fim',
        type: 'date-range',
        placeholder: 'Data de Fim',
      },
      {
        key: 'showCurrentOnly',
        label: 'Mostrar apenas férias ativas',
        type: 'toggle',
        placeholder: 'Mostrar apenas férias ativas',
      },
    ],
  },

  search: {
    placeholder: 'Buscar férias da equipe...',
    debounce: 500,
  },

  export: {
    title: 'Férias da Equipe',
    filename: 'ferias-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'position', label: 'Cargo', path: 'user.position.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => value ? TYPE_LABELS[value] : '-' },
      { key: 'startAt', label: 'Início', path: 'startAt', format: 'date' },
      { key: 'endAt', label: 'Fim', path: 'endAt', format: 'date' },
      { key: 'days', label: 'Dias', path: 'days', format: (vacation) => {
        const startAt = new Date(vacation.startAt)
        const endAt = new Date(vacation.endAt)
        const days = Math.ceil((endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return String(days || 0)
      } },
    ],
  },

  // No create action - vacations are managed in HR module
  actions: undefined,

  emptyState: {
    icon: 'calendar',
    title: 'Nenhuma férias encontrada',
    description: 'Não há férias registradas para sua equipe',
  },
}
