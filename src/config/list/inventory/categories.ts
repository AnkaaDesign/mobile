import type { ListConfig } from '@/components/list/types'
import type { ItemCategory } from '@/types'
import { canEditItems } from '@/utils/permissions/entity-permissions'

export const categoriesListConfig: ListConfig<ItemCategory> = {
  key: 'inventory-categories',
  title: 'Categorias',

  query: {
    hook: 'useItemCategoriesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    // Use select to fetch only fields needed for list display
    // Remove items: true to avoid fetching all items for each category
    select: {
      id: true,
      name: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          items: true,
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
        render: (category) => category.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (category) => category.type || '-',
      },
      {
        key: 'itemCount',
        label: 'PRODUTOS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (category) => String((category as any)._count?.items || 0),
        format: 'count-badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (category) => category.createdAt || '-',
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'itemCount', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (category, router) => {
          router.push(`/estoque/produtos/categorias/detalhes/${category.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (category, router) => {
          router.push(`/estoque/produtos/categorias/editar/${category.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (category) => `Deseja excluir a categoria "${category.name}"?`,
        },
        onPress: async (category, _, { delete: deleteCategory }) => {
          await deleteCategory(category.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'hasItems',
        label: 'Com Produtos',
        description: 'Apenas categorias que possuem produtos',
        type: 'toggle',
        placeholder: 'Com Produtos',
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
    placeholder: 'Buscar categorias...',
    debounce: 500,
  },

  export: {
    title: 'Categorias',
    filename: 'categorias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'type', label: 'Tipo', path: 'type' },
      { key: 'itemCount', label: 'Produtos', path: '_count.items' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Categoria',
      route: '/estoque/produtos/categorias/cadastrar',
      canCreate: canEditItems,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'categoria' : 'categorias'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
