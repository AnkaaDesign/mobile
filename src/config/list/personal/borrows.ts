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
    hook: 'useMyBorrowsInfiniteMobile',
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
        width: 1.5,
        align: 'center',
        render: (borrow) => BORROW_STATUS_LABELS[borrow.status] || borrow.status,
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
        label: 'DATA DE EMPRÉSTIMO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (borrow) => borrow.createdAt,
        format: 'datetime-multiline',
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
        render: (borrow) => String(borrow.quantityReturned || 0),
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
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'statuses',
        label: 'Status',
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
        placeholder: 'Apenas Atrasados',
        description: 'Mostrar apenas empréstimos atrasados',
      },
      {
        key: 'itemIds',
        label: 'Itens',
        type: 'select',
        multiple: true,
        placeholder: 'Selecione os itens',
      },
      {
        key: 'categoryIds',
        label: 'Categorias',
        type: 'select',
        multiple: true,
        placeholder: 'Selecione as categorias',
      },
      {
        key: 'brandIds',
        label: 'Marcas',
        type: 'select',
        multiple: true,
        placeholder: 'Selecione as marcas',
      },
      {
        key: 'borrowDate',
        label: 'Data de Empréstimo',
        type: 'date-range',
        placeholder: 'Data de Empréstimo',
      },
      {
        key: 'returnDate',
        label: 'Data de Devolução',
        type: 'date-range',
        placeholder: 'Data de Devolução',
      },
      {
        key: 'updatedAt',
        label: 'Data de Atualização',
        type: 'date-range',
        placeholder: 'Data de Atualização',
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
      { key: 'createdAt', label: 'Data de Empréstimo', path: 'createdAt', format: 'date' },
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
