import React from 'react'
import type { ListConfig } from '@/components/list/types'
import type { Responsible } from '@/types'
import { ResponsibleRole, RESPONSIBLE_ROLE_LABELS } from '@/types/responsible'
import { canEditResponsibles } from '@/utils/permissions/entity-permissions'
import { formatBrazilianPhone } from '@/utils'
import { Badge } from '@/components/ui/badge'
import type { BadgeVariant } from '@/constants/badge-colors'

const ROLE_BADGE_VARIANTS: Record<ResponsibleRole, BadgeVariant> = {
  [ResponsibleRole.COMMERCIAL]: 'blue',
  [ResponsibleRole.OWNER]: 'indigo',
  [ResponsibleRole.SELLER]: 'cyan',
  [ResponsibleRole.REPRESENTATIVE]: 'teal',
  [ResponsibleRole.COORDINATOR]: 'green',
  [ResponsibleRole.MARKETING]: 'purple',
  [ResponsibleRole.FINANCIAL]: 'orange',
  [ResponsibleRole.FLEET_MANAGER]: 'gray',
  [ResponsibleRole.DRIVER]: 'yellow',
}

export const responsiblesListConfig: ListConfig<Responsible> = {
  key: 'administration-responsibles',
  title: 'Responsáveis',

  query: {
    hook: 'useResponsiblesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          fantasyName: true,
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
        render: (resp: Responsible) => resp.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'role',
        label: 'FUNÇÃO',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (resp: Responsible) => {
          const variant = ROLE_BADGE_VARIANTS[resp.role] || 'default'
          const label = RESPONSIBLE_ROLE_LABELS[resp.role] || resp.role || '-'
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
        key: 'company',
        label: 'EMPRESA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (resp: Responsible) => resp.company?.corporateName || resp.company?.fantasyName || '-',
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (resp: Responsible) => formatBrazilianPhone(resp.phone),
      },
      {
        key: 'email',
        label: 'E-MAIL',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (resp: Responsible) => resp.email || '-',
      },
      {
        key: 'isActive',
        label: 'STATUS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (resp: Responsible) => (
          <Badge
            variant={resp.isActive ? 'active' : 'inactive'}
            size="sm"
            style={{ alignSelf: 'flex-start' }}
          >
            {resp.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (resp: Responsible) => resp.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'role', 'phone'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (resp, router) => {
          router.push(`/administracao/responsaveis/detalhes/${resp.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (resp, router) => {
          router.push(`/administracao/responsaveis/editar/${resp.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (resp) => `Deseja excluir o responsável "${resp.name}"?`,
        },
        onPress: async (resp, _, context) => {
          await context?.delete?.(resp.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'role',
        label: 'Função',
        type: 'select',
        options: Object.values(ResponsibleRole).map((role) => ({
          label: RESPONSIBLE_ROLE_LABELS[role],
          value: role,
        })),
        placeholder: 'Selecione a função',
      },
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Ativo', value: 'true' },
          { label: 'Inativo', value: 'false' },
        ],
        placeholder: 'Selecione o status',
      },
    ],
  },

  search: {
    placeholder: 'Buscar responsáveis...',
    debounce: 300,
  },

  export: {
    title: 'Responsáveis',
    filename: 'responsaveis',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'role', label: 'Função', path: 'role' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'email', label: 'E-mail', path: 'email' },
      { key: 'company', label: 'Empresa', path: 'company.corporateName' },
      { key: 'isActive', label: 'Status', path: 'isActive', format: (value: boolean) => value ? 'Ativo' : 'Inativo' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Responsável',
      route: '/administracao/responsaveis/cadastrar',
      canCreate: canEditResponsibles,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'responsável' : 'responsáveis'}?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
