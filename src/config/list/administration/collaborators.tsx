import React from 'react'
import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { canEditUsers } from '@/utils/permissions/entity-permissions'
import { USER_STATUS } from '@/constants/enums'
import { Badge } from '@/components/ui/badge'
import { getBadgeVariant } from '@/constants/badge-colors'

const STATUS_LABELS: Record<string, string> = {
  EXPERIENCE_PERIOD_1: 'Experiência 1',
  EXPERIENCE_PERIOD_2: 'Experiência 2',
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
    // Use optimized select for better performance - fetches only required fields
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      status: true,
      isActive: true,
      avatarId: true,
      payrollNumber: true,
      verified: true,
      lastLoginAt: true,
      requirePasswordChange: true,
      performanceLevel: true,
      birth: true,
      admissional: true,
      dismissedAt: true,
      city: true,
      state: true,
      zipCode: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      createdAt: true,
      updatedAt: true,
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      managedSector: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          createdTasks: true,
          vacations: true,
        },
      },
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
        width: 1.8,
        align: 'left',
        render: (user) => {
          const variant = getBadgeVariant(user.status, 'USER')
          const label = STATUS_LABELS[user.status] || user.status || '-'
          return (
            <Badge
              variant={variant}
              size="sm"
              style={{ alignSelf: 'flex-start' }}
            >
              {label}
            </Badge>
          )
        },
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
        key: 'admissional',
        label: 'ADMISSÃO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (user) => user.admissional,
        format: 'date',
      },
      {
        key: 'pis',
        label: 'PIS',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.pis || '-',
      },
      {
        key: 'payrollNumber',
        label: 'Nº FOLHA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (user) => user.payrollNumber || '-',
      },
      {
        key: 'birth',
        label: 'DATA DE NASCIMENTO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (user) => user.birth,
        format: 'date',
      },
      {
        key: 'dismissedAt',
        label: 'DATA DE DEMISSÃO',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (user) => user.dismissedAt,
        format: 'date',
      },
      {
        key: 'performanceLevel',
        label: 'NÍVEL DE PERFORMANCE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => String(user.performanceLevel || 0),
        format: 'number',
      },
      {
        key: 'verified',
        label: 'VERIFICADO',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (user) => user.verified ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'lastLoginAt',
        label: 'ÚLTIMO LOGIN',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (user) => user.lastLoginAt || '-',
        format: 'datetime',
      },
      {
        key: 'managedSector',
        label: 'SETOR GERENCIADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.managedSector?.name || '-',
      },
      {
        key: 'city',
        label: 'CIDADE',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.city || '-',
      },
      {
        key: 'state',
        label: 'ESTADO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (user) => user.state || '-',
      },
      {
        key: 'zipCode',
        label: 'CEP',
        sortable: true,
        width: 1.1,
        align: 'left',
        render: (user) => user.zipCode || '-',
      },
      {
        key: 'address',
        label: 'ENDEREÇO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => {
          if (!user.address) return '-';
          let full = user.address;
          if (user.addressNumber) full += `, ${user.addressNumber}`;
          if (user.addressComplement) full += ` - ${user.addressComplement}`;
          return full;
        },
      },
      {
        key: 'neighborhood',
        label: 'BAIRRO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.neighborhood || '-',
      },
      {
        key: 'requirePasswordChange',
        label: 'REQUER ALTERAÇÃO DE SENHA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (user) => user.requirePasswordChange ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'tasksCount',
        label: 'TAREFAS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (user) => String(user._count?.createdTasks || 0),
        format: 'number',
      },
      {
        key: 'vacationsCount',
        label: 'FÉRIAS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (user) => String(user._count?.vacations || 0),
        format: 'number',
      },
      {
        key: 'createdAt',
        label: 'DATA DE CRIAÇÃO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (user) => user.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ÚLTIMA ATUALIZAÇÃO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (user) => user.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['name', 'sector', 'status'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
        onPress: async (user, _, mutations) => {
          await mutations?.delete?.(user.id)
        },
      },
    ],
  },

  filters: {
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
      {
        key: 'positionIds',
        label: 'Cargos',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['positions', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getPositions } = await import('@/api-client')
            const pageSize = 20
            const response = await getPositions({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((position: any) => ({
                label: position.name,
                value: position.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Position Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os cargos',
      },
      {
        key: 'sectorIds',
        label: 'Setores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['sectors', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getSectors } = await import('@/api-client')
            const pageSize = 20
            const response = await getSectors({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((sector: any) => ({
                label: sector.name,
                value: sector.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Sector Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os setores',
      },
      {
        key: 'birth',
        label: 'Data de Nascimento',
        type: 'date-range',
        placeholder: 'Data de Nascimento',
      },
      {
        key: 'dismissedAt',
        label: 'Data de Demissão',
        type: 'date-range',
        placeholder: 'Data de Demissão',
      },
      {
        key: 'exp1EndAt',
        label: 'Data de Contratação',
        type: 'date-range',
        placeholder: 'Data de Contratação',
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
      { key: 'payrollNumber', label: 'Nº Folha', path: 'payrollNumber' },
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'pis', label: 'PIS', path: 'pis' },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'managedSector', label: 'Setor Gerenciado', path: 'managedSector.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'birth', label: 'Data de Nascimento', path: 'birth', format: 'date' },
      { key: 'dismissedAt', label: 'Data de Demissão', path: 'dismissedAt', format: 'date' },
      { key: 'admissional', label: 'Data de Admissão', path: 'admissional', format: 'date' },
      { key: 'performanceLevel', label: 'Nível de Performance', path: 'performanceLevel' },
      { key: 'verified', label: 'Verificado', path: 'verified', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'lastLoginAt', label: 'Último Login', path: 'lastLoginAt', format: 'datetime' },
      { key: 'city', label: 'Cidade', path: 'city' },
      { key: 'state', label: 'Estado', path: 'state' },
      { key: 'zipCode', label: 'CEP', path: 'zipCode' },
      { key: 'address', label: 'Endereço', path: 'address' },
      { key: 'neighborhood', label: 'Bairro', path: 'neighborhood' },
      { key: 'requirePasswordChange', label: 'Requer Alteração de Senha', path: 'requirePasswordChange', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'createdAt', label: 'Data de Criação', path: 'createdAt', format: 'datetime' },
      { key: 'updatedAt', label: 'Última Atualização', path: 'updatedAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Colaborador',
      route: '/administracao/colaboradores/cadastrar',
      canCreate: canEditUsers,
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
        onPress: async (ids, mutations) => {
          await mutations?.batchUpdate?.({ ids: Array.from(ids), status: 'ACTIVE' })
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
        onPress: async (ids, mutations) => {
          await mutations?.batchUpdate?.({ ids: Array.from(ids), status: 'INACTIVE' })
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
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
