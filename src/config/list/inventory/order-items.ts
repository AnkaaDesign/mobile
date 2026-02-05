import type { ListConfig } from '@/components/list/types'
import type { OrderItem } from '@/types'
import { canEditOrders } from '@/utils/permissions/entity-permissions'
import { formatCurrency } from '@/utils'

/**
 * Order Items List Configuration
 *
 * IMPORTANT: This is a NESTED ROUTE configuration for /estoque/pedidos/[orderId]/items/listar
 *
 * The page component needs to:
 * 1. Extract orderId from route params using useLocalSearchParams()
 * 2. Pass orderId to the config's query.where: { orderIds: [orderId] }
 * 3. Use the Layout component with the modified config
 *
 * Example usage in page:
 * ```tsx
 * const { orderId } = useLocalSearchParams<{ orderId: string }>()
 * const config = useMemo(() => ({
 *   ...orderItemsListConfig,
 *   query: {
 *     ...orderItemsListConfig.query,
 *     where: { orderIds: [orderId] },
 *   },
 * }), [orderId])
 * return <Layout config={config} />
 * ```
 */
export const orderItemsListConfig: ListConfig<OrderItem> = {
  key: 'inventory-order-items',
  title: 'Itens do Pedido',

  query: {
    hook: 'useOrderItemsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
    // Note: where clause with orderIds will be merged at runtime in the page component
  },

  table: {
    columns: [
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (orderItem) => orderItem.item?.name || orderItem.temporaryItemDescription || 'Item desconhecido',
        style: { fontWeight: '500' },
      },
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (orderItem) => orderItem.item?.uniCode || '-',
      },
      {
        key: 'item.brand.name',
        label: 'MARCA',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (orderItem) => orderItem.item?.brand?.name || '-',
      },
      {
        key: 'orderedQuantity',
        label: 'QTD PEDIDA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (orderItem) => String(orderItem.orderedQuantity || 0),
        format: 'number',
      },
      {
        key: 'receivedQuantity',
        label: 'QTD RECEBIDA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (orderItem) => String(orderItem.receivedQuantity || 0),
        format: 'number',
        component: 'quantity-with-status', // Special component for received/pending status
      },
      {
        key: 'price',
        label: 'PREÇO UNIT.',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (orderItem) => String(orderItem.price || 0),
        format: 'currency',
      },
      {
        key: 'totalPrice',
        label: 'TOTAL',
        sortable: false,
        width: 1.2,
        align: 'right',
        render: (orderItem) => (orderItem.price || 0) * (orderItem.orderedQuantity || 0),
        format: 'currency',
        style: { fontWeight: '600' },
      },
      {
        key: 'icms',
        label: 'ICMS (%)',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (orderItem) => String(orderItem.icms || 0),
        format: 'percentage',
      },
      {
        key: 'ipi',
        label: 'IPI (%)',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (orderItem) => String(orderItem.ipi || 0),
        format: 'percentage',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (orderItem) => {
          if (orderItem.receivedQuantity && orderItem.receivedQuantity >= orderItem.orderedQuantity) {
            return 'Recebido'
          }
          if (orderItem.receivedQuantity && orderItem.receivedQuantity > 0) {
            return 'Parcial'
          }
          return 'Pendente'
        },
        format: 'badge',
      },
      {
        key: 'receivedAt',
        label: 'RECEBIDO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (orderItem) => orderItem.receivedAt || '-',
        format: 'date',
      },
      {
        key: 'fulfilledAt',
        label: 'ATENDIDO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (orderItem) => orderItem.fulfilledAt,
        format: 'date',
      },
    ],
    defaultVisible: ['item.name', 'orderedQuantity', 'receivedQuantity', 'totalPrice'],
    rowHeight: 70,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (orderItem, router) => {
          router.push(`/estoque/pedidos/${orderItem.orderId}/items/detalhes/${orderItem.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (orderItem, router) => {
          router.push(`/estoque/pedidos/${orderItem.orderId}/items/editar/${orderItem.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (orderItem) =>
            `Tem certeza que deseja remover "${orderItem.item?.name || 'este item'}" do pedido?`,
        },
        onPress: async (orderItem, _, context) => {
          await context?.delete?.(orderItem.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'receivedStatus',
        label: 'Status de Recebimento',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Pendente', value: 'pending' },
          { label: 'Parcial', value: 'partial' },
          { label: 'Recebido', value: 'received' },
        ],
        placeholder: 'Selecione os status',
      },
      {
        key: 'receivedAt',
        label: 'Data de Recebimento',
        type: 'date-range',
        placeholder: 'Data de Recebimento',
      },
      {
        key: 'fulfilledAt',
        label: 'Data de Atendimento',
        type: 'date-range',
        placeholder: 'Data de Atendimento',
      },
      {
        key: 'priceRange',
        label: 'Preço',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
      {
        key: 'quantityRange',
        label: 'Quantidade',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
      },
    ],
  },

  search: {
    placeholder: 'Buscar itens do pedido...',
    debounce: 500,
  },

  export: {
    title: 'Itens do Pedido',
    filename: 'itens-do-pedido',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
      { key: 'brand', label: 'Marca', path: 'item.brand.name' },
      { key: 'orderedQuantity', label: 'Qtd. Pedida', path: 'orderedQuantity', format: 'number' },
      { key: 'receivedQuantity', label: 'Qtd. Recebida', path: 'receivedQuantity', format: 'number' },
      {
        key: 'price',
        label: 'Preço Unitário',
        path: 'price',
        format: (value: any) => formatCurrency(value),
      },
      {
        key: 'totalPrice',
        label: 'Total',
        format: (value: any) => formatCurrency((value?.price || 0) * (value?.orderedQuantity || 0)),
      },
      { key: 'icms', label: 'ICMS (%)', path: 'icms', format: 'number' },
      { key: 'ipi', label: 'IPI (%)', path: 'ipi', format: 'number' },
      {
        key: 'status',
        label: 'Status',
        format: (value: any) => {
          if (value?.receivedQuantity && value.receivedQuantity >= value.orderedQuantity) {
            return 'Recebido'
          }
          if (value?.receivedQuantity && value.receivedQuantity > 0) {
            return 'Parcial'
          }
          return 'Pendente'
        },
      },
      { key: 'receivedAt', label: 'Recebido Em', path: 'receivedAt', format: 'date' },
      { key: 'fulfilledAt', label: 'Atendido Em', path: 'fulfilledAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Adicionar Item',
      route: '', // Will be set dynamically in page component with orderId
      canCreate: canEditOrders,
    },
    bulk: [
      {
        key: 'markReceived',
        label: 'Marcar como Recebido',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Recebimento',
          message: (count) => `Deseja marcar ${count} ${count === 1 ? 'item' : 'itens'} como recebido?`,
        },
        onPress: async (ids, context) => {
          // Convert ids to array of { id, receivedQuantity }
          // This would need access to the items to get orderedQuantity
          // For now, this is a placeholder
          console.warn('Bulk mark received not fully implemented - needs item data access')
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'item' : 'itens'} do pedido?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },

  emptyState: {
    icon: 'package',
    title: 'Nenhum item no pedido',
    description: 'Comece adicionando itens ao pedido',
  },
}
