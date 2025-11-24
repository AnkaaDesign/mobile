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
      measures: true,
    },
  },

  table: {
    columns: [
      {
        key: 'uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (item) => item.uniCode || '-',
      },
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
        key: 'brand.name',
        label: 'MARCA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (item) => item.brand?.name || '-',
      },
      {
        key: 'category.name',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (item) => item.category?.name || '-',
      },
      {
        key: 'ppeCA',
        label: 'CA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.ppeCA || '-',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.quantity?.toString() || '0',
      },
      {
        key: 'measures',
        label: 'MEDIDAS',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (item) => item.measures?.length > 0 ? `${item.measures.length} medida(s)` : '-',
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (item) => item.description || '-',
      },
      {
        key: 'currentPrice',
        label: 'PREÇO ATUAL',
        sortable: false,
        width: 1.3,
        align: 'right',
        render: (item) => {
          const price = item.prices && item.prices.length > 0 ? item.prices[0] : null
          return price?.value || 0
        },
        format: 'currency',
      },
      {
        key: 'minQuantity',
        label: 'QTD MÍNIMA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.reorderPoint?.toString() || '0',
      },
      {
        key: 'maxQuantity',
        label: 'QTD MÁXIMA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.maxQuantity?.toString() || '-',
      },
      {
        key: 'reorderPoint',
        label: 'PONTO DE REPOSIÇÃO',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (item) => item.reorderPoint?.toString() || '0',
      },
      {
        key: 'location',
        label: 'LOCALIZAÇÃO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (item) => item.location || '-',
      },
      {
        key: 'unit',
        label: 'UNIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.unit || '-',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (item) => item.createdAt,
        format: 'datetime',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (item) => item.updatedAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['name', 'brand.name', 'quantity'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
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
    fields: [
      {
        key: 'brandIds',
        type: 'select',
        multiple: true,
        placeholder: 'Marcas',
      },
      {
        key: 'ppeType',
        type: 'select',
        multiple: true,
        options: Object.values(PPE_TYPE).map((type) => ({
          label: PPE_TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Tipo de EPI',
      },
      {
        key: 'createdAtRange',
        type: 'date-range',
        placeholder: { from: 'Criação de', to: 'Criação até' },
      },
      {
        key: 'showInactive',
        type: 'toggle',
        placeholder: 'Mostrar inativos',
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
      { key: 'uniCode', label: 'Código', path: 'uniCode' },
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'brand.name', label: 'Marca', path: 'brand.name' },
      { key: 'category.name', label: 'Categoria', path: 'category.name' },
      { key: 'ppeCA', label: 'CA', path: 'ppeCA' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity' },
      { key: 'measures', label: 'Medidas', path: 'measures', format: (value) => value?.length || 0 },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'currentPrice', label: 'Preço Atual', path: 'prices[0].value', format: 'currency' },
      { key: 'minQuantity', label: 'Qtd Mínima', path: 'reorderPoint' },
      { key: 'maxQuantity', label: 'Qtd Máxima', path: 'maxQuantity' },
      { key: 'reorderPoint', label: 'Ponto de Reposição', path: 'reorderPoint' },
      { key: 'location', label: 'Localização', path: 'location' },
      { key: 'unit', label: 'Unidade', path: 'unit' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'datetime' },
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
