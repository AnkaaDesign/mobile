import type { ListConfig } from '@/components/list/types'
import type { Position } from '@/types'

export const positionsListConfig: ListConfig<Position> = {
  key: 'hr-positions',
  title: 'Cargos',

  query: {
    hook: 'usePositionsInfiniteMobile',
    defaultSort: { field: 'hierarchy', direction: 'asc' },
    pageSize: 25,
    include: {
      _count: {
        select: {
          users: true,
          remunerations: true,
        },
      },
      remunerations: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
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
        render: (position) => position.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'hierarchy',
        label: 'HIERARQUIA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (position) => String(position.hierarchy || 0),
        format: 'number',
      },
      {
        key: 'bonifiable',
        label: 'BONIFICÁVEL',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (position) => position.bonifiable,
        format: 'boolean',
      },
      {
        key: 'remuneration',
        label: 'REMUNERAÇÃO',
        sortable: true,
        width: 1.3,
        align: 'right',
        render: (position) => {
          const remunerations = (position as any).remunerations
          if (remunerations && remunerations.length > 0) {
            return remunerations[0].value
          }
          return 0
        },
        format: 'currency',
      },
      {
        key: 'users',
        label: 'COLABORADORES',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (position) => String((position as any)._count?.users || 0),
        format: 'badge',
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (position) => position.description || '-',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (position) => position.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'hierarchy', 'remuneration'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (position, router) => {
          router.push(`/recursos-humanos/cargos/detalhes/${position.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (position, router) => {
          router.push(`/recursos-humanos/cargos/editar/${position.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (position) => `Deseja excluir o cargo "${position.name}"?`,
        },
        onPress: async (position, _, { delete: deletePosition }) => {
          await deletePosition(position.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'bonifiable',
        label: 'Apenas Bonificáveis',
        type: 'toggle',
        placeholder: 'Apenas bonificáveis',
      },
      {
        key: 'hasUsers',
        label: 'Com Colaboradores',
        type: 'toggle',
        placeholder: 'Com colaboradores',
      },
      {
        key: 'hierarchyRange',
        label: 'Hierarquia',
        type: 'number-range',
        placeholder: { min: 'Hierarquia mínima', max: 'Hierarquia máxima' },
      },
      {
        key: 'remunerationRange',
        label: 'Remuneração',
        type: 'number-range',
        placeholder: { min: 'Remuneração mínima', max: 'Remuneração máxima' },
      },
      {
        key: 'createdAt',
        label: 'Data de Cadastro',
        type: 'date-range',
        placeholder: 'Data de Cadastro',
      },
    ],
  },

  search: {
    placeholder: 'Buscar cargos...',
    debounce: 300,
  },

  export: {
    title: 'Cargos',
    filename: 'cargos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'hierarchy', label: 'Hierarquia', path: 'hierarchy' },
      { key: 'bonifiable', label: 'Bonificável', path: 'bonifiable', format: 'boolean' },
      { key: 'remuneration', label: 'Remuneração', path: 'remunerations[0].value', format: 'currency' },
      { key: 'users', label: 'Colaboradores', path: '_count.users' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Cargo',
      route: '/recursos-humanos/cargos/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'cargo' : 'cargos'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
