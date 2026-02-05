import React from 'react'
import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'
import { canEditUsers } from '@/utils/permissions/entity-permissions'
import { SECTOR_PRIVILEGES } from '@/constants/enums'
import { SECTOR_PRIVILEGES_LABELS } from '@/constants/enum-labels'
import { Badge } from '@/components/ui/badge'
import { getBadgeVariant } from '@/constants/badge-colors'

const STATUS_LABELS: Record<string, string> = {
  EXPERIENCE_PERIOD_1: 'Experiência 1',
  EXPERIENCE_PERIOD_2: 'Experiência 2',
  EFFECTED: 'Efetivado',
  DISMISSED: 'Desligado',
}

// Get all sector privileges as options
const PRIVILEGE_OPTIONS = Object.values(SECTOR_PRIVILEGES).map((privilege) => ({
  label: SECTOR_PRIVILEGES_LABELS[privilege],
  value: privilege,
}))

export const usersListConfig: ListConfig<User> = {
  key: 'administration-users',
  title: 'Usuários do Sistema',

  query: {
    hook: 'useUsersInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    // Use optimized select for 50% less data transfer
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      isActive: true,
      avatarId: true,
      payrollNumber: true,
      verified: true,
      requirePasswordChange: true,
      cpf: true,
      city: true,
      state: true,
      lastLoginAt: true,
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
          privileges: true, // Needed for privileges display
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
          changeLogs: true,
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
        key: 'sector',
        label: 'SETOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.sector?.name || '-',
      },
      {
        key: 'privilege',
        label: 'PRIVILÉGIO',
        sortable: true,
        width: 1.8,
        align: 'center',
        render: (user) => {
          const privilege = user.sector?.privileges
          if (!privilege) return <Badge variant="secondary" size="sm">Nenhum</Badge>

          const variant = getBadgeVariant(privilege, 'SECTOR_PRIVILEGES')
          const label = SECTOR_PRIVILEGES_LABELS[privilege as SECTOR_PRIVILEGES] || privilege

          return (
            <Badge
              variant={variant}
              size="sm"
              style={{ alignSelf: 'center' }}
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
        key: 'managedSector',
        label: 'SETOR GERENCIADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (user) => user.managedSector?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (user) => {
          const variant = getBadgeVariant(user.status, 'USER')
          const label = STATUS_LABELS[user.status] || user.status || '-'
          return (
            <Badge
              variant={variant}
              size="sm"
              style={{ alignSelf: 'center' }}
            >
              {label}
            </Badge>
          )
        },
      },
      {
        key: 'verified',
        label: 'VERIFICADO',
        sortable: true,
        width: 1.1,
        align: 'center',
        render: (user) => user.verified ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'requirePasswordChange',
        label: 'REQUER ALT. SENHA',
        sortable: true,
        width: 1.6,
        align: 'center',
        render: (user) => user.requirePasswordChange ? 'Sim' : 'Não',
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
        key: 'cpf',
        label: 'CPF',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (user) => user.cpf || '-',
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
        key: 'payrollNumber',
        label: 'Nº FOLHA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (user) => user.payrollNumber || '-',
      },
      {
        key: 'tasksCount',
        label: 'TAREFAS CRIADAS',
        sortable: false,
        width: 1.3,
        align: 'center',
        render: (user) => String(user._count?.createdTasks || 0),
        format: 'number',
      },
      {
        key: 'changeLogsCount',
        label: 'ALTERAÇÕES',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (user) => String(user._count?.changeLogs || 0),
        format: 'number',
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
    defaultVisible: ['name', 'email', 'sector', 'privilege', 'status'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (user, router) => {
          router.push(`/administracao/usuarios/detalhes/${user.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (user, router) => {
          router.push(`/administracao/usuarios/editar/${user.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (user) => `Deseja excluir o usuário "${user.name}"?`,
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
            }
          } catch (error) {
            console.error('[Sector Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os setores',
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
            }
          } catch (error) {
            console.error('[Position Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os cargos',
      },
      {
        key: 'verified',
        type: 'toggle',
        label: 'Apenas Verificados',
      },
      {
        key: 'requirePasswordChange',
        type: 'toggle',
        label: 'Requer Alteração de Senha',
      },
      {
        key: 'hasManagedSector',
        type: 'toggle',
        label: 'Tem Setor Gerenciado',
      },
      {
        key: 'lastLoginAt',
        label: 'Último Login',
        type: 'date-range',
        placeholder: 'Último Login',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar usuários...',
    debounce: 300,
  },

  export: {
    title: 'Usuários do Sistema',
    filename: 'usuarios-sistema',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'email', label: 'Email', path: 'email' },
      { key: 'cpf', label: 'CPF', path: 'cpf' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'sector', label: 'Setor', path: 'sector.name' },
      { key: 'privilege', label: 'Privilégio', path: 'sector.privileges', format: (value) => SECTOR_PRIVILEGES_LABELS[value as SECTOR_PRIVILEGES] || String(value) },
      { key: 'position', label: 'Cargo', path: 'position.name' },
      { key: 'managedSector', label: 'Setor Gerenciado', path: 'managedSector.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || String(value) },
      { key: 'verified', label: 'Verificado', path: 'verified', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'requirePasswordChange', label: 'Requer Alt. Senha', path: 'requirePasswordChange', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'lastLoginAt', label: 'Último Login', path: 'lastLoginAt', format: 'datetime' },
      { key: 'payrollNumber', label: 'Nº Folha', path: 'payrollNumber' },
      { key: 'city', label: 'Cidade', path: 'city' },
      { key: 'state', label: 'Estado', path: 'state' },
      { key: 'createdAt', label: 'Data de Criação', path: 'createdAt', format: 'datetime' },
      { key: 'updatedAt', label: 'Última Atualização', path: 'updatedAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Usuário',
      route: '/administracao/usuarios/cadastrar',
      canCreate: canEditUsers,
    },
    bulk: [
      {
        key: 'verify',
        label: 'Verificar',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Verificação',
          message: (count) => `Verificar ${count} ${count === 1 ? 'usuário' : 'usuários'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchUpdate?.({ ids: Array.from(ids), verified: true })
        },
      },
      {
        key: 'requirePasswordChange',
        label: 'Forçar Alt. Senha',
        icon: 'lock',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Alteração',
          message: (count) => `Forçar alteração de senha para ${count} ${count === 1 ? 'usuário' : 'usuários'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchUpdate?.({ ids: Array.from(ids), requirePasswordChange: true })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'usuário' : 'usuários'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
