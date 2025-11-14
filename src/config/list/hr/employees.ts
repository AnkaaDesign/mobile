import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import {
  USER_STATUS,
  USER_STATUS_LABELS,
} from '@/constants'
import { getUserStatusBadgeText } from '@/utils/user'
import { formatCPF, formatBrazilianPhone} from '@/utils'

export const employeesListConfig: ListConfig<User> = {
  key: 'hr-employees',
  title: 'Funcionários',

  query: {
    hook: 'useUsersInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      position: true,
      sector: true,
      ppeConfig: true,
      managedSector: true,
      avatar: true,
      _count: {
        tasks: true,
        createdTasks: true,
        vacations: true,
        warnings: true,
        borrows: true,
        ppeRequests: true,
        bonuses: true,
      },
    },
  },

  table: {
    columns: [
      {
        key: 'payrollNumber',
        label: 'Nº FOLHA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (employee) => employee.payrollNumber || '-',
      },
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (employee) => employee.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'email',
        label: 'EMAIL',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (employee) => employee.email || '-',
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (employee) => employee.phone ? formatBrazilianPhone(employee.phone) : '-',
      },
      {
        key: 'cpf',
        label: 'CPF',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (employee) => employee.cpf ? formatCPF(employee.cpf) : '-',
        style: { fontFamily: 'monospace' },
      },
      {
        key: 'pis',
        label: 'PIS',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (employee) => employee.pis || '-',
        style: { fontFamily: 'monospace' },
      },
      {
        key: 'position.name',
        label: 'CARGO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (employee) => employee.position?.name || '-',
        format: 'badge',
      },
      {
        key: 'sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.7,
        align: 'left',
        render: (employee) => employee.sector?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (employee) => getUserStatusBadgeText(employee),
        format: 'badge',
      },
      {
        key: 'birth',
        label: 'DATA DE NASCIMENTO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (employee) => employee.birth,
        format: 'date',
      },
      {
        key: 'admissional',
        label: 'DATA DE ADMISSÃO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (employee) => employee.admissional,
        format: 'date',
      },
      {
        key: 'dismissedAt',
        label: 'DATA DE DEMISSÃO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (employee) => employee.dismissedAt,
        format: 'date',
      },
      {
        key: 'tasksCount',
        label: 'TAREFAS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (employee) => (employee as any)._count?.createdTasks || 0,
        format: 'badge',
      },
      {
        key: 'vacationsCount',
        label: 'FÉRIAS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (employee) => (employee as any)._count?.vacations || 0,
        format: 'badge',
      },
      {
        key: 'warningsCount',
        label: 'ADVERTÊNCIAS',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (employee) => (employee as any)._count?.warnings || 0,
        format: 'badge',
      },
      {
        key: 'performanceLevel',
        label: 'NÍVEL DE PERFORMANCE',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (employee) => employee.performanceLevel || 0,
        format: 'badge',
      },
      {
        key: 'verified',
        label: 'VERIFICADO',
        sortable: true,
        width: 1.1,
        align: 'center',
        render: (employee) => employee.verified,
        format: 'boolean',
      },
      {
        key: 'lastLoginAt',
        label: 'ÚLTIMO LOGIN',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (employee) => employee.lastLoginAt,
        format: 'datetime',
      },
      {
        key: 'managedSector.name',
        label: 'SETOR GERENCIADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (employee) => employee.managedSector?.name || '-',
      },
      {
        key: 'city',
        label: 'CIDADE',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (employee) => employee.city || '-',
      },
      {
        key: 'state',
        label: 'ESTADO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (employee) => employee.state || '-',
      },
      {
        key: 'zipCode',
        label: 'CEP',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (employee) => employee.zipCode || '-',
      },
      {
        key: 'address',
        label: 'ENDEREÇO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (employee) => {
          if (!employee.address) return '-'
          let fullAddress = employee.address
          if (employee.addressNumber) fullAddress += `, ${employee.addressNumber}`
          if (employee.addressComplement) fullAddress += ` - ${employee.addressComplement}`
          return fullAddress
        },
      },
      {
        key: 'neighborhood',
        label: 'BAIRRO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (employee) => employee.neighborhood || '-',
      },
      {
        key: 'requirePasswordChange',
        label: 'REQUER ALTERAÇÃO DE SENHA',
        sortable: true,
        width: 2.0,
        align: 'center',
        render: (employee) => employee.requirePasswordChange,
        format: 'boolean',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (employee) => employee.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ÚLTIMA ATUALIZAÇÃO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (employee) => employee.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['name', 'position.name', 'status'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (employee, router) => {
          router.push(`/recursos-humanos/funcionarios/detalhes/${employee.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (employee, router) => {
          router.push(`/recursos-humanos/funcionarios/editar/${employee.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (employee) => `Deseja excluir o funcionário "${employee.name}"?`,
        },
        onPress: async (employee, _, { delete: deleteEmployee }) => {
          await deleteEmployee(employee.id)
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
            label: 'Status do Funcionário',
            description: 'Filtrar por status do funcionário',
            type: 'select',
            multiple: true,
            options: Object.values(USER_STATUS).map((status) => ({
              label: USER_STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Todos os status',
          },
          {
            key: 'verified',
            label: 'Funcionários Verificados',
            description: 'Incluir apenas funcionários verificados',
            type: 'toggle',
          },
        ],
      },
      {
        key: 'organization',
        label: 'Cargo e Setor',
        icon: 'briefcase',
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
              // Load from API
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
              // Load from API
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
            key: 'admissional',
            label: 'Data de Admissão',
            type: 'date-range',
          },
          {
            key: 'birth',
            label: 'Data de Nascimento',
            type: 'date-range',
          },
          {
            key: 'dismissedAt',
            label: 'Data de Demissão',
            type: 'date-range',
          },
          {
            key: 'exp1StartAt',
            label: 'Início da Experiência 1',
            type: 'date-range',
          },
          {
            key: 'exp2StartAt',
            label: 'Início da Experiência 2',
            type: 'date-range',
          },
          {
            key: 'createdAt',
            label: 'Data de Criação',
            type: 'date-range',
          },
          {
            key: 'updatedAt',
            label: 'Data de Atualização',
            type: 'date-range',
          },
        ],
      },
      {
        key: 'ranges',
        label: 'Faixas de Valores',
        icon: 'chart-bar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'performanceLevel',
            label: 'Nível de Performance',
            type: 'number-range',
            placeholder: { min: 'Mín', max: 'Máx' },
            min: 0,
            max: 100,
          },
          {
            key: 'payrollNumber',
            label: 'Número da Folha',
            type: 'number-range',
            placeholder: { min: 'Mín', max: 'Máx' },
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
      { key: 'payrollNumber', label: 'Nº Folha', path: 'payrollNumber', format: 'number' },
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'pis', label: 'PIS', path: 'pis' },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => USER_STATUS_LABELS[value as USER_STATUS] || value
      },
      { key: 'birth', label: 'Data de Nascimento', path: 'birth', format: 'date' },
      { key: 'admissional', label: 'Data de Admissão', path: 'admissional', format: 'date' },
      { key: 'dismissedAt', label: 'Data de Demissão', path: 'dismissedAt', format: 'date' },
      { key: 'performanceLevel', label: 'Nível de Performance', path: 'performanceLevel', format: 'number' },
      { key: 'verified', label: 'Verificado', path: 'verified', format: 'boolean' },
      { key: 'lastLoginAt', label: 'Último Login', path: 'lastLoginAt', format: 'datetime' },
      { key: 'managedSector', label: 'Setor Gerenciado', path: 'managedSector.name' },
      { key: 'city', label: 'Cidade', path: 'city' },
      { key: 'state', label: 'Estado', path: 'state' },
      { key: 'zipCode', label: 'CEP', path: 'zipCode' },
      { key: 'address', label: 'Endereço', path: 'address' },
      { key: 'addressNumber', label: 'Número', path: 'addressNumber' },
      { key: 'addressComplement', label: 'Complemento', path: 'addressComplement' },
      { key: 'neighborhood', label: 'Bairro', path: 'neighborhood' },
      { key: 'requirePasswordChange', label: 'Requer Alteração de Senha', path: 'requirePasswordChange', format: 'boolean' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Funcionário',
      route: '/recursos-humanos/funcionarios/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'funcionário' : 'funcionários'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },

  emptyState: {
    icon: 'users',
    title: 'Nenhum funcionário cadastrado',
    description: 'Comece cadastrando o primeiro funcionário',
  },
}
