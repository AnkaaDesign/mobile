import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { USER_STATUS } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  EXPERIENCE_PERIOD_1: 'Experiência 1/2 (45 dias)',
  EXPERIENCE_PERIOD_2: 'Experiência 2/2 (45 dias)',
  EFFECTED: 'Efetivado',
  DISMISSED: 'Desligado',
}

export const personalEmployeesListConfig: ListConfig<User> = {
  key: 'personal-employees',
  title: 'Funcionários',

  query: {
    hook: 'useUsersInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      position: true,
      sector: true,
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'position',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.position?.name || '-',
      },
      {
        key: 'sector',
        label: 'SETOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.sector?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (user) => user.status,
        format: 'badge',
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 1.3,
        align: 'left',
        render: (user) => user.phone || '-',
      },
      {
        key: 'email',
        label: 'EMAIL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.email || '-',
      },
    ],
    defaultVisible: ['name', 'position', 'sector', 'status'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (user, router) => {
          router.push(`/pessoal/funcionarios/detalhes/${user.id}`)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'user-check',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            multiple: true,
            options: Object.values(USER_STATUS).map((status) => ({
              label: STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Relacionamentos',
        icon: 'link',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'positionIds',
            label: 'Cargos',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os cargos',
          },
          {
            key: 'sectorIds',
            label: 'Setores',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os setores',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar funcionários...',
    debounce: 300,
  },

  export: {
    title: 'Funcionários',
    filename: 'funcionarios',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'phone', label: 'Telefone', path: 'phone' },
    ],
  },

  // No create/edit/delete - personal view is read-only
  actions: undefined,
}
