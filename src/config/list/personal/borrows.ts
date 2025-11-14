import type { ListConfig } from '@/components/list/types'
import type { Borrow } from '@/types'
import {
  BORROW_STATUS,
  BORROW_STATUS_LABELS,
} from '@/constants'

export const personalBorrowsListConfig: ListConfig<Borrow> = {
  key: 'personal-borrows',
  title: 'Meus Empréstimos',

  query: {
    hook: 'useBorrowsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (borrow) => borrow.item?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (borrow) => borrow.status,
        format: 'badge',
        component: 'status-badge',
      },
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.uniCode || '-',
      },
      {
        key: 'item.category.name',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.category?.name || '-',
      },
      {
        key: 'item.brand.name',
        label: 'MARCA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.brand?.name || '-',
      },
      {
        key: 'item.supplier.name',
        label: 'FORNECEDOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.supplier?.name || '-',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (borrow) => borrow.quantity,
        format: 'number',
      },
      {
        key: 'createdAt',
        label: 'EMPRESTADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (borrow) => borrow.createdAt,
        format: 'date',
      },
      {
        key: 'returnedAt',
        label: 'DEVOLVIDO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (borrow) => borrow.returnedAt,
        format: 'date',
      },
      {
        key: 'quantityReturned',
        label: 'QTD. DEVOLVIDA',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (borrow) => borrow.quantityReturned || 0,
        format: 'number',
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (borrow) => borrow.reason || '-',
      },
      {
        key: 'notes',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 1.8,
        align: 'left',
        render: (borrow) => borrow.notes || '-',
      },
      {
        key: 'conditionNotes',
        label: 'CONDIÇÃO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (borrow) => borrow.conditionNotes || '-',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (borrow) => borrow.updatedAt,
        format: 'date',
      },
    ],
    defaultVisible: ['item.name', 'status', 'createdAt'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (borrow, router) => {
          router.push(`/pessoal/meus-emprestimos/detalhes/${borrow.id}` as any)
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
            key: 'statuses',
            label: 'Status do Empréstimo',
            type: 'select',
            multiple: true,
            options: Object.values(BORROW_STATUS).map((status) => ({
              label: BORROW_STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
          {
            key: 'isOverdue',
            label: 'Apenas Atrasados',
            type: 'toggle',
            description: 'Mostrar apenas empréstimos atrasados',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Itens',
        icon: 'package',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'itemIds',
            label: 'Itens',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
              return []
            },
            placeholder: 'Selecione os itens',
          },
          {
            key: 'categoryIds',
            label: 'Categorias',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
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
              // Load from API
              return []
            },
            placeholder: 'Selecione as marcas',
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
            key: 'borrowDate',
            label: 'Data de Empréstimo',
            type: 'date-range',
          },
          {
            key: 'returnDate',
            label: 'Data de Devolução',
            type: 'date-range',
          },
          {
            key: 'updatedAt',
            label: 'Data de Atualização',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar empréstimos...',
    debounce: 300,
  },

  export: {
    title: 'Meus Empréstimos',
    filename: 'meus-emprestimos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'uniCode', label: 'Código', path: 'item.uniCode' },
      { key: 'category', label: 'Categoria', path: 'item.category.name' },
      { key: 'brand', label: 'Marca', path: 'item.brand.name' },
      { key: 'supplier', label: 'Fornecedor', path: 'item.supplier.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'quantityReturned', label: 'Quantidade Devolvida', path: 'quantityReturned', format: 'number' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => BORROW_STATUS_LABELS[value] || value },
      { key: 'createdAt', label: 'Emprestado Em', path: 'createdAt', format: 'date' },
      { key: 'returnedAt', label: 'Devolvido Em', path: 'returnedAt', format: 'date' },
      { key: 'reason', label: 'Motivo', path: 'reason' },
      { key: 'notes', label: 'Observações', path: 'notes' },
      { key: 'conditionNotes', label: 'Condição', path: 'conditionNotes' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  // No create/edit/delete for personal borrows - read-only view
  actions: undefined,

  emptyState: {
    icon: 'package',
    title: 'Nenhum empréstimo encontrado',
    description: 'Você não possui empréstimos registrados',
  },
}
