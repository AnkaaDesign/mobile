import type { ListConfig } from '@/components/list/types'
import type { PaintBrand } from '@/types'

export const paintBrandsListConfig: ListConfig<PaintBrand> = {
  key: 'painting-paint-brands',
  title: 'Marcas de Tinta',

  query: {
    hook: 'usePaintBrandsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      _count: {
        select: {
          paints: true,
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
        key: 'paintsCount',
        label: 'TINTAS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (brand) => (brand as any)._count?.paints || 0,
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (brand) => brand.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'paintsCount'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (brand, router) => {
          router.push(`/pintura/marcas-de-tinta/detalhes/${brand.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (brand, router) => {
          router.push(`/pintura/marcas-de-tinta/editar/${brand.id}`)
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
    sections: [
      {
        key: 'options',
        label: 'Opções',
        icon: 'settings',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'hasPaints',
            label: 'Com Tintas',
            description: 'Apenas marcas com tintas cadastradas',
            type: 'toggle',
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
            key: 'createdAt',
            label: 'Data de Cadastro',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar marcas de tinta...',
    debounce: 300,
  },

  export: {
    title: 'Marcas de Tinta',
    filename: 'marcas-de-tinta',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'paintsCount', label: 'Tintas', path: '_count.paints' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Marca de Tinta',
      route: '/pintura/marcas-de-tinta/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'marca de tinta' : 'marcas de tinta'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
