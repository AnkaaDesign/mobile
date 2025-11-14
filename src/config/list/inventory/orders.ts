import type { ListConfig } from '@/components/list/types'
import type { Order } from '@/types'
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
} from '@/constants'

export const ordersListConfig: ListConfig<Order> = {
  key: 'inventory-orders',
  title: 'Pedidos',

  query: {
    hook: 'useOrdersInfiniteMobile',
    defaultSort: { field: 'status', direction: 'asc' },
    pageSize: 25,
    include: {
      supplier: { select: { id: true, fantasyName: true } },
      _count: { select: { items: true } },
    },
  },

  table: {
    columns: [
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (order) => order.description || 'Sem descrição',
        style: { fontWeight: '500' },
      },
      {
        key: 'supplier.fantasyName',
        label: 'FORNECEDOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (order) => order.supplier?.fantasyName || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (order) => order.status,
        format: 'badge',
      },
      {
        key: 'itemsCount',
        label: 'ITENS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (order) => (order as any)._count?.items || order.items?.length || 0,
        format: 'badge',
      },
      {
        key: 'totalPrice',
        label: 'VALOR TOTAL',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (order) => {
          const total = order.items?.reduce((sum, item) => {
            const quantity = item.orderedQuantity || 0
            const price = item.price || 0
            const icms = item.icms || 0
            const ipi = item.ipi || 0
            const subtotal = quantity * price
            const itemTotal = subtotal + (subtotal * icms / 100) + (subtotal * ipi / 100)
            return sum + itemTotal
          }, 0) || 0
          return total
        },
        format: 'currency',
      },
      {
        key: 'forecast',
        label: 'PREVISÃO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (order) => order.forecast,
        format: 'date',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (order) => order.createdAt,
        format: 'date',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (order) => order.updatedAt,
        format: 'date',
      },
      {
        key: 'notes',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (order) => order.notes || '-',
      },
    ],
    defaultVisible: ['description', 'status', 'itemsCount'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (order, router) => {
          router.push(`/estoque/pedidos/detalhes/${order.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (order, router) => {
          router.push(`/estoque/pedidos/editar/${order.id}`)
        },
      },
      {
        key: 'duplicate',
        label: 'Duplicar',
        icon: 'copy',
        variant: 'default',
        onPress: (order, router) => {
          router.push({
            pathname: `/estoque/pedidos/cadastrar`,
            params: { duplicateFrom: order.id },
          })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (order) => `Deseja excluir o pedido "${order.description}"?`,
        },
        onPress: async (order, _, { delete: deleteOrder }) => {
          await deleteOrder(order.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'package',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status do Pedido',
            type: 'select',
            multiple: true,
            options: Object.values(ORDER_STATUS).map((status) => ({
              label: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status,
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'supplier',
        label: 'Fornecedor',
        icon: 'building',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'supplierIds',
            label: 'Fornecedores',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
              return []
            },
            placeholder: 'Selecione os fornecedores',
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
            label: 'Data de Criação',
            type: 'date-range',
          },
          {
            key: 'forecast',
            label: 'Previsão de Entrega',
            type: 'date-range',
          },
          {
            key: 'updatedAt',
            label: 'Data de Atualização',
            type: 'date-range',
          },
        ],
      },
      {
        key: 'ranges',
        label: 'Faixas de Valores',
        icon: 'coins',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'totalPriceRange',
            label: 'Valor Total (R$)',
            type: 'number-range',
            placeholder: { min: 'Mín', max: 'Máx' },
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar pedidos...',
    debounce: 300,
  },

  export: {
    title: 'Pedidos',
    filename: 'pedidos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'supplier', label: 'Fornecedor', path: 'supplier.fantasyName' },
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => ORDER_STATUS_LABELS[value as keyof typeof ORDER_STATUS_LABELS] || value,
      },
      {
        key: 'itemsCount',
        label: 'Quantidade de Itens',
        path: '_count.items',
        format: 'number',
      },
      {
        key: 'totalPrice',
        label: 'Valor Total',
        format: (order) => {
          const total = order.items?.reduce((sum: number, item: any) => {
            const quantity = item.orderedQuantity || 0
            const price = item.price || 0
            const icms = item.icms || 0
            const ipi = item.ipi || 0
            const subtotal = quantity * price
            const itemTotal = subtotal + (subtotal * icms / 100) + (subtotal * ipi / 100)
            return sum + itemTotal
          }, 0) || 0
          return total.toFixed(2)
        },
      },
      { key: 'forecast', label: 'Previsão de Entrega', path: 'forecast', format: 'date' },
      { key: 'notes', label: 'Observações', path: 'notes' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Pedido',
      route: '/estoque/pedidos/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'pedido' : 'pedidos'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
