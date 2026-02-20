import React from 'react'
import type { ListConfig } from '@/components/list/types'
import type { Representative } from '@/types'
import { RepresentativeRole, REPRESENTATIVE_ROLE_LABELS } from '@/types/representative'
import { canEditRepresentatives } from '@/utils/permissions/entity-permissions'
import { formatBrazilianPhone } from '@/utils'
import { Badge } from '@/components/ui/badge'
import type { BadgeVariant } from '@/constants/badge-colors'

const ROLE_BADGE_VARIANTS: Record<RepresentativeRole, BadgeVariant> = {
  [RepresentativeRole.COMMERCIAL]: 'blue',
  [RepresentativeRole.MARKETING]: 'purple',
  [RepresentativeRole.COORDINATOR]: 'green',
  [RepresentativeRole.FINANCIAL]: 'orange',
  [RepresentativeRole.FLEET_MANAGER]: 'gray',
}

export const representativesListConfig: ListConfig<Representative> = {
  key: 'administration-representatives',
  title: 'Representantes',

  query: {
    hook: 'useRepresentativesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      customerId: true,
      createdAt: true,
      updatedAt: true,
      customer: {
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
        render: (rep: Representative) => rep.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'role',
        label: 'FUNÇÃO',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (rep: Representative) => {
          const variant = ROLE_BADGE_VARIANTS[rep.role] || 'default'
          const label = REPRESENTATIVE_ROLE_LABELS[rep.role] || rep.role || '-'
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
        key: 'customer',
        label: 'CLIENTE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (rep: Representative) => rep.customer?.fantasyName || '-',
      },
      {
        key: 'phone',
        label: 'TELEFONE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (rep: Representative) => formatBrazilianPhone(rep.phone),
      },
      {
        key: 'email',
        label: 'E-MAIL',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (rep: Representative) => rep.email || '-',
      },
      {
        key: 'isActive',
        label: 'STATUS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (rep: Representative) => (
          <Badge
            variant={rep.isActive ? 'active' : 'inactive'}
            size="sm"
            style={{ alignSelf: 'flex-start' }}
          >
            {rep.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (rep: Representative) => rep.createdAt,
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
        onPress: (rep, router) => {
          router.push(`/administracao/representantes/detalhes/${rep.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (rep, router) => {
          router.push(`/administracao/representantes/editar/${rep.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (rep) => `Deseja excluir o representante "${rep.name}"?`,
        },
        onPress: async (rep, _, context) => {
          await context?.delete?.(rep.id)
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
        options: Object.values(RepresentativeRole).map((role) => ({
          label: REPRESENTATIVE_ROLE_LABELS[role],
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
    placeholder: 'Buscar representantes...',
    debounce: 300,
  },

  export: {
    title: 'Representantes',
    filename: 'representantes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'role', label: 'Função', path: 'role' },
      { key: 'phone', label: 'Telefone', path: 'phone' },
      { key: 'email', label: 'E-mail', path: 'email' },
      { key: 'customer', label: 'Cliente', path: 'customer.fantasyName' },
      { key: 'isActive', label: 'Status', path: 'isActive', format: (value: boolean) => value ? 'Ativo' : 'Inativo' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Representante',
      route: '/administracao/representantes/cadastrar',
      canCreate: canEditRepresentatives,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'representante' : 'representantes'}?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
