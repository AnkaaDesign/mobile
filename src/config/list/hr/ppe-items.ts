import type { ListConfig } from '@/components/list/types'
import type { Item } from '@/types'
import { PPE_TYPE } from '@/constants/enums'

const PPE_TYPE_LABELS: Record<string, string> = {
  SHIRT: 'Camisa',
  PANTS: 'Calça',
  BOOTS: 'Botas',
  SLEEVES: 'Manguito',
  MASK: 'Máscara',
  GLOVES: 'Luvas',
  RAIN_BOOTS: 'Galocha',
  OTHERS: 'Outros',
}

export const ppeItemsListConfig: ListConfig<Item> = {
  key: 'hr-ppe-items',
  title: 'EPIs',

  query: {
    hook: 'usePpeInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      category: true,
      brand: true,
      supplier: true,
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
        render: (item) => item.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'ppeType',
        label: 'TIPO EPI',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (item) => (item.ppeType ? PPE_TYPE_LABELS[item.ppeType] || item.ppeType : '-'),
      },
      {
        key: 'category',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (item) => item.category?.name || '-',
      },
      {
        key: 'brand',
        label: 'MARCA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (item) => item.brand?.name || '-',
      },
      {
        key: 'quantity',
        label: 'ESTOQUE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.quantity?.toString() || '0',
      },
      {
        key: 'minQuantity',
        label: 'MÍN',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (item) => item.minQuantity?.toString() || '-',
      },
    ],
    defaultVisible: ['name', 'ppeType', 'category', 'quantity'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (item, router) => {
          router.push(`/recursos-humanos/epi/detalhes/${item.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (item, router) => {
          router.push(`/recursos-humanos/epi/editar/${item.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (item) => `Deseja excluir o EPI "${item.name}"?`,
        },
        onPress: async (item, _, { delete: deleteItem }) => {
          await deleteItem(item.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'ppeType',
        label: 'Tipo de EPI',
        icon: 'shield',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'ppeType',
            label: 'Tipo',
            type: 'select',
            multiple: true,
            options: Object.values(PPE_TYPE).map((type) => ({
              label: PPE_TYPE_LABELS[type],
              value: type,
            })),
            placeholder: 'Selecione os tipos',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Relacionamentos',
        icon: 'link',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'categoryIds',
            label: 'Categorias',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione as categorias',
          },
          {
            key: 'brandIds',
            label: 'Marcas',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione as marcas',
          },
        ],
      },
      {
        key: 'stock',
        label: 'Estoque',
        icon: 'package',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'lowStock',
            label: 'Estoque Baixo',
            type: 'toggle',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar EPIs...',
    debounce: 300,
  },

  export: {
    title: 'EPIs',
    filename: 'epis',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'ppeType', label: 'Tipo EPI', path: 'ppeType', format: (value) => (value ? PPE_TYPE_LABELS[value] || value : '-') },
      { key: 'category', label: 'Categoria', path: 'category.name' },
      { key: 'brand', label: 'Marca', path: 'brand.name' },
      { key: 'quantity', label: 'Estoque', path: 'quantity' },
      { key: 'minQuantity', label: 'Mínimo', path: 'minQuantity' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar EPI',
      route: '/recursos-humanos/epi/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'EPI' : 'EPIs'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
