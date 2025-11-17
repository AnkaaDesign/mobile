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
  ANNUAL: 'Férias Anuais',
  COLLECTIVE: 'Férias Coletivas',
  MEDICAL: 'Licença Médica',
  MATERNITY: 'Licença Maternidade',
  PATERNITY: 'Licença Paternidade',
  EMERGENCY: 'Emergência',
  STUDY: 'Licença Estudo',
  UNPAID: 'Unpaid',
  OTHER: 'Outro',
}

export const vacationsListConfig: ListConfig<Vacation> = {
  key: 'hr-vacations',
  title: 'Férias',

  query: {
    hook: 'useVacationsInfiniteMobile',
    defaultSort: { field: 'startAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
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
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.3,
        align: 'center',
        render: (vacation) => vacation.status,
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
        render: (vacation) => vacation.startAt,
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
        render: (vacation) => vacation.days || 0,
        format: 'number',
      },
      {
        key: 'monetaryValue',
        label: 'ABONO PECUNIÁRIO',
        sortable: true,
        width: 1.5,
        align: 'right',
        render: (vacation) => vacation.monetaryValue || 0,
        format: 'currency',
      },
      {
        key: 'notes',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (vacation) => vacation.notes || '-',
      },
    ],
    defaultVisible: ['user.name', 'status', 'startAt', 'endAt'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (vacation, router) => {
          router.push(`/recursos-humanos/ferias/detalhes/${vacation.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        visible: (vacation) => vacation.status === 'PENDING',
        onPress: (vacation, router) => {
          router.push(`/recursos-humanos/ferias/editar/${vacation.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (vacation) => `Deseja excluir estas férias?`,
        },
        onPress: async (vacation, _, { delete: deleteVacation }) => {
          await deleteVacation(vacation.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'package',
        collapsible: true,
        defaultOpen: true,
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
        ],
      },
      {
        key: 'collaborator',
        label: 'Colaborador',
        icon: 'user',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'userIds',
            label: 'Colaboradores',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os colaboradores',
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
            key: 'startAt',
            label: 'Data de Início',
            type: 'date-range',
          },
          {
            key: 'endAt',
            label: 'Data de Fim',
            type: 'date-range',
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
    title: 'Férias',
    filename: 'ferias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => value ? TYPE_LABELS[value] : '-' },
      { key: 'startAt', label: 'Início', path: 'startAt', format: 'date' },
      { key: 'endAt', label: 'Fim', path: 'endAt', format: 'date' },
      { key: 'days', label: 'Dias', path: 'days' },
      { key: 'monetaryValue', label: 'Abono Pecuniário', path: 'monetaryValue', format: 'currency' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Férias',
      route: '/recursos-humanos/ferias/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'férias' : 'férias'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
