import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { USER_STATUS } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  EXPERIENCE_PERIOD_1: 'Experiência 1/2 (45 dias)',
  EXPERIENCE_PERIOD_2: 'Experiência 2/2 (45 dias)',
  EFFECTED: 'Efetivado',
  DISMISSED: 'Desligado',
}

export const collaboratorsListConfig: ListConfig<User> = {
  key: 'administration-collaborators',
  title: 'Colaboradores',

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
        key: 'email',
        label: 'EMAIL',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.email || '-',
      },
      {
        key: 'cpf',
        label: 'CPF',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.cpf || '-',
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
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 1.3,
        align: 'left',
        render: (user) => user.phone || '-',
      },
      {
        key: 'admissionalDate',
        label: 'ADMISSÃO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (user) => user.admissionalDate,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'email', 'status', 'position'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (user, router) => {
          router.push(`/administracao/colaboradores/detalhes/${user.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (user, router) => {
          router.push(`/administracao/colaboradores/editar/${user.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (user) => `Deseja excluir o colaborador "${user.name}"?`,
        },
        onPress: async (user, _, { delete: deleteUser }) => {
          await deleteUser(user.id)
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
      {
        key: 'dates',
        label: 'Datas',
        icon: 'calendar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'admissionalDate',
            label: 'Data de Admissão',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar colaboradores...',
    debounce: 300,
  },

  export: {
    title: 'Colaboradores',
    filename: 'colaboradores',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'admissionalDate', label: 'Admissão', path: 'admissionalDate', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Colaborador',
      route: '/administracao/colaboradores/cadastrar',
    },
    bulk: [
      {
        key: 'activate',
        label: 'Ativar',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Ativação',
          message: (count) => `Ativar ${count} ${count === 1 ? 'colaborador' : 'colaboradores'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'ACTIVE' })
        },
      },
      {
        key: 'deactivate',
        label: 'Desativar',
        icon: 'x',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Desativação',
          message: (count) => `Desativar ${count} ${count === 1 ? 'colaborador' : 'colaboradores'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'INACTIVE' })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'colaborador' : 'colaboradores'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
