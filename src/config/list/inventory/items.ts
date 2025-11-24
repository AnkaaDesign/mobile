import type { ListConfig } from '@/components/list/types'
import type { Item } from '@/types'
import {
  MEASURE_UNIT,
  MEASURE_TYPE,
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  MEASURE_UNIT_LABELS,
  MEASURE_TYPE_LABELS,
  ITEM_CATEGORY_TYPE,
  ITEM_CATEGORY_TYPE_LABELS,
} from '@/constants'
import { canEditItems } from '@/utils/permissions/entity-permissions'

export const itemsListConfig: ListConfig<Item> = {
  key: 'inventory-items',
  title: 'Produtos',

  query: {
    hook: 'useItemsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      brand: true,
      category: true,
      supplier: true,
    },
  },

  table: {
    columns: [
      {
        key: 'uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
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
        width: 1.2,
        align: 'left',
        render: (item) => item.brand?.name || '-',
      },
      {
        key: 'category.name',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (item) => item.category?.name || '-',
      },
      {
        key: 'measures',
        label: 'MEDIDAS',
        sortable: false,
        width: 1.4,
        align: 'left',
        render: (item) => {
          if (!item.measures || item.measures.length === 0) return '-'
          return item.measures
            .map((m) => `${m.value || '-'}${m.unit || ''}`)
            .join(' × ')
        },
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 0.9,
        align: 'left',
        render: (item) => String(item.quantity || 0),
        component: 'quantity-with-status',
      },
      {
        key: 'monthlyConsumption',
        label: 'CONSUMO MENSAL',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (item) => {
          if (!item.monthlyConsumption) return '-'
          return Math.round(item.monthlyConsumption).toLocaleString('pt-BR')
        },
        component: 'consumption-with-trend',
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (item) => item.prices?.[0]?.value || null,
        format: 'currency',
      },
      {
        key: 'totalPrice',
        label: 'VALOR TOTAL',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (item) => item.totalPrice || null,
        format: 'currency',
      },
      {
        key: 'CA',
        label: 'CA',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (item) => item.ppeCA || '-',
      },
      {
        key: 'barcodes',
        label: 'CÓDIGOS DE BARRAS',
        sortable: false,
        width: 1.6,
        align: 'left',
        render: (item) => item.barcodes?.join(', ') || '-',
        style: { fontFamily: 'monospace' },
      },
      {
        key: 'maxQuantity',
        label: 'QTD. MÁXIMA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.maxQuantity,
        format: 'number',
      },
      {
        key: 'reorderPoint',
        label: 'PONTO DE REPOSIÇÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (item) => item.reorderPoint,
        format: 'number',
      },
      {
        key: 'icms',
        label: 'ICMS',
        sortable: true,
        width: 0.8,
        align: 'right',
        render: (item) => item.icms,
        format: 'percentage',
      },
      {
        key: 'ipi',
        label: 'IPI',
        sortable: true,
        width: 0.8,
        align: 'right',
        render: (item) => item.ipi,
        format: 'percentage',
      },
      {
        key: 'supplier.fantasyName',
        label: 'FORNECEDOR',
        sortable: true,
        width: 1.4,
        align: 'left',
        render: (item) => item.supplier?.fantasyName || '-',
      },
      {
        key: 'ppeType',
        label: 'TIPO EPI',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (item) => item.ppeType || null,
        format: 'badge',
      },
      {
        key: 'shouldAssignToUser',
        label: 'ATRIBUIR AO USUÁRIO',
        sortable: true,
        width: 1.4,
        align: 'center',
        render: (item) => item.shouldAssignToUser || '-',
        format: 'boolean',
      },
      {
        key: 'estimatedLeadTime',
        label: 'PRAZO ESTIMADO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (item) => item.estimatedLeadTime ? `${item.estimatedLeadTime} dias` : '-',
      },
      {
        key: 'isActive',
        label: 'STATUS',
        sortable: true,
        width: 0.9,
        align: 'center',
        render: (item) => item.isActive,
        format: 'status',
      },
      {
        key: 'activitiesCount',
        label: 'ATIVIDADES',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (item) => String((item as any)._count?.activities || 0),
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (item) => item.createdAt || '-',
        format: 'date',
      },
    ],
    defaultVisible: ['uniCode', 'name', 'quantity'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (item, router) => {
          router.push(`/estoque/produtos/detalhes/${item.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (item, router) => {
          router.push(`/estoque/produtos/editar/${item.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (item) => `Deseja excluir o produto "${item.name}"?`,
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
        key: 'isActive',
        description: 'Incluir apenas produtos ativos',
        type: 'toggle',
        defaultValue: true,
        placeholder: 'Produtos Ativos',
      },
      {
        key: 'shouldAssignToUser',
        description: 'Atribuir produtos ao usuário',
        type: 'toggle',
        placeholder: 'Atribuir ao Usuário',
      },
      {
        key: 'stockLevels',
        type: 'select',
        multiple: true,
        options: Object.values(STOCK_LEVEL).map((level) => ({
          label: STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS] || level,
          value: level,
        })),
        placeholder: 'Nível de Estoque',
      },
      {
        key: 'nearReorderPoint',
        description: 'Itens próximos ao ponto de reposição',
        type: 'toggle',
        placeholder: 'Próximo ao Ponto de Reposição',
      },
      {
        key: 'noReorderPoint',
        description: 'Itens sem ponto de reposição definido',
        type: 'toggle',
        placeholder: 'Sem Ponto de Reposição',
      },
      {
        key: 'brandIds',
        type: 'select',
        multiple: true,
        placeholder: 'Marcas',
      },
      {
        key: 'categoryIds',
        type: 'select',
        multiple: true,
        placeholder: 'Categorias',
      },
      {
        key: 'supplierIds',
        type: 'select',
        multiple: true,
        placeholder: 'Fornecedores',
      },
      {
        key: 'measureUnits',
        type: 'select',
        multiple: true,
        options: Object.values(MEASURE_UNIT).map((unit) => ({
          label: MEASURE_UNIT_LABELS[unit] || unit,
          value: unit,
        })),
        placeholder: 'Unidades de Medida',
      },
      {
        key: 'measureTypes',
        type: 'select',
        multiple: true,
        options: Object.values(MEASURE_TYPE).map((type) => ({
          label: MEASURE_TYPE_LABELS[type] || type,
          value: type,
        })),
        placeholder: 'Tipos de Medida',
      },
      {
        key: 'quantityRange',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'totalPriceRange',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'icmsRange',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'ipiRange',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'monthlyConsumptionRange',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'measureValueRange',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'createdAt',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
      {
        key: 'updatedAt',
        type: 'date-range',
        placeholder: 'Data de Atualização',
      },
    ],
  },

  search: {
    placeholder: 'Buscar produtos...',
    debounce: 300,
  },

  export: {
    title: 'Produtos',
    filename: 'produtos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'uniCode', label: 'Código', path: 'uniCode' },
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'brand', label: 'Marca', path: 'brand.name' },
      { key: 'category', label: 'Categoria', path: 'category.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'price', label: 'Preço', path: 'prices[0].value', format: 'currency' },
      { key: 'totalPrice', label: 'Valor Total', path: 'totalPrice', format: 'currency' },
      { key: 'supplier', label: 'Fornecedor', path: 'supplier.fantasyName' },
      { key: 'isActive', label: 'Ativo', path: 'isActive', format: 'boolean' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Produto',
      route: '/estoque/produtos/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'item' : 'itens'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
