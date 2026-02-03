import type { ListConfig } from '@/components/list/types'
import type { ItemBrand } from '@/types'
import { canEditItems } from '@/utils/permissions/entity-permissions'

export const brandsListConfig: ListConfig<ItemBrand> = {
  key: 'inventory-brands',
  title: 'Marcas',

  query: {
    hook: 'useItemBrandsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      items: true,
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
        width: 2.5,
        align: 'left',
        render: (brand) => brand.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'itemCount',
        label: 'PRODUTOS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (brand) => String((brand as any)._count?.items || 0),
        format: 'count-badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (brand) => brand.createdAt || '-',
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
        onPress: (brand, router) => {
          router.push(`/estoque/produtos/marcas/detalhes/${brand.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (brand, router) => {
          router.push(`/estoque/produtos/marcas/editar/${brand.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (brand) => `Deseja excluir a marca "${brand.name}"?`,
        },
        onPress: async (brand, _, { delete: deleteBrand }) => {
          await deleteBrand(brand.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'hasItems',
        label: 'Com Produtos',
        description: 'Apenas marcas que possuem produtos',
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
    placeholder: 'Buscar marcas...',
    debounce: 500,
  },

  export: {
    title: 'Marcas',
    filename: 'marcas',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'itemCount', label: 'Produtos', path: '_count.items' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Marca',
      route: '/estoque/produtos/marcas/cadastrar',
      canCreate: canEditItems,
    },
    bulk: [
      {
        key: 'edit',
        label: 'Editar em Lote',
        icon: 'pencil',
        variant: 'default',
        onPress: (ids, _, router) => {
          const idsArray = Array.from(ids)
          router.push(`/estoque/produtos/marcas/editar-em-lote?ids=${idsArray.join(',')}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'marca' : 'marcas'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
