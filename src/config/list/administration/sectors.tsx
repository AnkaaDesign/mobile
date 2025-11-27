import React from 'react'
import type { ListConfig } from '@/components/list/types'
import type { Sector } from '@/types'
import { canEditHrEntities } from '@/utils/permissions/entity-permissions'
import { SECTOR_PRIVILEGES } from '@/constants/enums'
import { SECTOR_PRIVILEGES_LABELS } from '@/constants/enum-labels'
import { Badge } from '@/components/ui/badge'
import { getBadgeVariant } from '@/constants/badge-colors'

export const sectorsListConfig: ListConfig<Sector> = {
  key: 'administration-sectors',
  title: 'Setores',

  query: {
    hook: 'useSectorsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      _count: {
        select: {
          users: true,
          tasks: true,
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
        width: 1.5,
        align: 'left',
        render: (sector) => sector.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'privileges',
        label: 'PRIVILÉGIOS',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (sector) => {
          if (!sector.privileges) return '-'
          const variant = getBadgeVariant(sector.privileges, 'SECTOR_PRIVILEGES')
          const label = SECTOR_PRIVILEGES_LABELS[sector.privileges] || sector.privileges
          return (
            <Badge
              variant={variant}
              size="sm"
            >
              {label}
            </Badge>
          )
        },
      },
      {
        key: 'usersCount',
        label: 'COLABORADORES',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (sector) => String((sector as any)._count?.users || 0),
        format: 'count-badge',
      },
      {
        key: 'tasksCount',
        label: 'TAREFAS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (sector) => String((sector as any)._count?.tasks || 0),
        format: 'count-badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (sector) => sector.createdAt || '-',
        format: 'date',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (sector) => sector.updatedAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'usersCount', 'privileges'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (sector, router) => {
          router.push(`/administracao/setores/detalhes/${sector.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (sector, router) => {
          router.push(`/administracao/setores/editar/${sector.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (sector) => `Deseja excluir o setor "${sector.name}"?`,
        },
        onPress: async (sector, _, { delete: deleteSector }) => {
          await deleteSector(sector.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'privileges',
        label: 'Privilégios',
        type: 'select',
        multiple: false,
        options: Object.values(SECTOR_PRIVILEGES).map((privilege) => ({
          label: SECTOR_PRIVILEGES_LABELS[privilege],
          value: privilege,
        })),
        placeholder: 'Selecione o privilégio',
      },
      {
        key: 'hasUsers',
        label: 'Com Colaboradores',
        type: 'toggle',
        placeholder: 'Com Colaboradores',
        description: 'Apenas setores com colaboradores',
      },
    ],
  },

  search: {
    placeholder: 'Buscar setores...',
    debounce: 300,
  },

  export: {
    title: 'Setores',
    filename: 'setores',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      {
        key: 'privileges',
        label: 'Privilégios',
        path: 'privileges',
        format: (value: string) => value ? SECTOR_PRIVILEGES_LABELS[value] || value : '-'
      },
      { key: 'usersCount', label: 'Colaboradores', path: '_count.users' },
      { key: 'tasksCount', label: 'Tarefas', path: '_count.tasks' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Setor',
      route: '/administracao/setores/cadastrar',
      canCreate: canEditHrEntities,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'setor' : 'setores'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
