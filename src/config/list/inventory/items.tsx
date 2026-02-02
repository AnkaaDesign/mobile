import React from 'react'
import { View, StyleSheet } from 'react-native'
import { IconAlertTriangleFilled } from '@tabler/icons-react-native'
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
import { determineStockLevel } from '@/utils'
import { ThemedText } from '@/components/ui/themed-text'
import { isTabletWidth } from '@/lib/table-utils'

const styles = StyleSheet.create({
  quantityCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

// Get stock level color (matching web exactly)
const getStockLevelColor = (stockLevel: string): string => {
  switch (stockLevel) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return '#737373' // neutral-500
    case STOCK_LEVEL.OUT_OF_STOCK:
      return '#b91c1c' // red-700
    case STOCK_LEVEL.CRITICAL:
      return '#f97316' // orange-500
    case STOCK_LEVEL.LOW:
      return '#eab308' // yellow-500
    case STOCK_LEVEL.OPTIMAL:
      return '#15803d' // green-700
    case STOCK_LEVEL.OVERSTOCKED:
      return '#9333ea' // purple-600
    default:
      return '#737373' // neutral-500
  }
}

export const itemsListConfig: ListConfig<Item> = {
  key: 'inventory-items',
  title: 'Produtos',

  query: {
    hook: 'useItemsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    // Use optimized select for 60% less data transfer
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      maxQuantity: true,
      reorderPoint: true,
      monthlyConsumption: true,
      isActive: true,
      abcCategory: true,
      xyzCategory: true,
      brandId: true,
      categoryId: true,
      supplierId: true,
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      supplier: {
        select: {
          id: true,
          fantasyName: true, // Use fantasyName for suppliers
        },
      },
      prices: {
        take: 1,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          value: true,
          updatedAt: true,
        },
      },
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
        label: 'QNT',
        sortable: true,
        width: 0.9,
        align: 'left',
        render: (item) => {
          const quantity = item.quantity || 0
          const stockLevel = determineStockLevel(
            quantity,
            item.reorderPoint || null,
            item.maxQuantity || null,
            false
          )
          const color = getStockLevelColor(stockLevel)
          const formattedQuantity = quantity % 1 === 0
            ? quantity.toLocaleString('pt-BR')
            : quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

          return (
            <View style={styles.quantityCell}>
              <IconAlertTriangleFilled size={16} color={color} />
              <ThemedText style={styles.quantityText}>{formattedQuantity}</ThemedText>
            </View>
          )
        },
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
        format: 'count-badge',
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
    defaultVisible: isTabletWidth()
      ? ['uniCode', 'name', 'brand.name', 'measures', 'quantity']
      : ['uniCode', 'name', 'quantity'],
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
        label: 'Status',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ambos', value: 'ambos' },
          { label: 'Ativo', value: 'ativo' },
          { label: 'Inativo', value: 'inativo' },
        ],
        placeholder: 'Selecione...',
      },
      {
        key: 'shouldAssignToUser',
        label: 'Atribuir ao usuário',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ambos', value: 'ambos' },
          { label: 'Sim', value: 'sim' },
          { label: 'Não', value: 'nao' },
        ],
        placeholder: 'Selecione...',
      },
      {
        key: 'stockLevels',
        label: 'Status de Estoque',
        type: 'select',
        multiple: true,
        options: Object.values(STOCK_LEVEL).map((level) => ({
          label: STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS] || level,
          value: level,
          icon: 'alert-triangle', // Same icon for all, different colors
          stockLevel: level, // Pass the level for color mapping
        })),
        placeholder: 'Selecione status de estoque...',
      },
      {
        key: 'categoryIds',
        label: 'Categoria',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['item-categories', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getItemCategories } = await import('@/api-client')
            const pageSize = 20
            const response = await getItemCategories({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((cat: any) => ({
                label: cat.name,
                value: cat.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Category Filter] Error:', error)
            return {
              data: [],
              hasMore: false,
            }
          }
        },
        placeholder: 'Selecione categorias...',
      },
      {
        key: 'brandIds',
        label: 'Marca',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['item-brands', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getItemBrands } = await import('@/api-client')
            const pageSize = 20
            const response = await getItemBrands({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((brand: any) => ({
                label: brand.name,
                value: brand.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Brand Filter] Error:', error)
            return {
              data: [],
              hasMore: false,
            }
          }
        },
        placeholder: 'Selecione marcas...',
      },
      {
        key: 'supplierIds',
        label: 'Fornecedor',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['suppliers', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getSuppliers } = await import('@/api-client')
            const pageSize = 20
            const response = await getSuppliers({
              where: searchTerm ? {
                OR: [
                  { fantasyName: { contains: searchTerm, mode: 'insensitive' } },
                  { corporateName: { contains: searchTerm, mode: 'insensitive' } },
                ],
              } : undefined,
              orderBy: { fantasyName: 'asc' },
              limit: pageSize,
              page: page,
            })
            console.log('[Supplier Filter] Response:', response, 'Page:', page, 'HasMore:', response.meta?.hasNextPage)
            return {
              data: (response.data || []).map((supplier: any) => ({
                label: supplier.fantasyName || supplier.corporateName || 'Sem nome',
                value: supplier.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Supplier Filter] Error:', error)
            return {
              data: [],
              hasMore: false,
            }
          }
        },
        placeholder: 'Selecione fornecedores...',
      },
      {
        key: 'quantityRange',
        label: 'Faixa de Quantidade',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
      },
      {
        key: 'totalPriceRange',
        label: 'Faixa de Preço',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
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
    toolbar: [
      {
        key: 'stock-balance',
        label: 'Balanco',
        icon: 'clipboard-check',
        variant: 'secondary',
        onPress: (router: any) => {
          router.push('/estoque/balanco/cadastrar')
        },
      },
    ],
    bulk: [
      {
        key: 'batch-edit',
        label: 'Editar em Lote',
        icon: 'pencil',
        variant: 'default',
        onPress: (ids, _, router) => {
          const idsArray = Array.from(ids)
          router.push(`/estoque/produtos/editar-em-lote?ids=${idsArray.join(',')}`)
        },
      },
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
