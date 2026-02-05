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
    defaultSort: { field: 'status', direction: 'asc' },
    pageSize: 20,
    select: {
      id: true,
      quantity: true,
      status: true,
      statusOrder: true,
      returnedAt: true,
      createdAt: true,
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
          quantity: true,
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
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          position: {
            select: {
              id: true,
              name: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
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
        sortField: 'statusOrder',
        width: 1.5,
        align: 'center',
        render: (borrow) => BORROW_STATUS_LABELS[borrow.status] || borrow.status,
        format: 'badge',
        badgeEntity: 'BORROW',
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
        key: 'item.supplier.fantasyName',
        label: 'FORNECEDOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.supplier?.fantasyName || '-',
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
    onRowPress: (borrow, router) => {
      router.push(`/(tabs)/pessoal/meus-emprestimos/detalhes/${borrow.id}` as any)
    },
  },

  filters: {
    defaultValues: {
      statuses: [],
    },
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
        async: true,
        queryKey: ['items', 'filter', 'tools'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getItems } = await import('@/api-client')
            const pageSize = 20
            const response = await getItems({
              where: {
                ...(searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : {}),
                category: { type: 'TOOL' },
              },
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((item: any) => ({
                label: `${item.name} (${item.uniCode || '-'})`,
                value: item.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Item Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os itens',
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
    ],
  },

  search: {
    placeholder: 'Buscar empréstimos...',
    debounce: 500,
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
      { key: 'supplier', label: 'Fornecedor', path: 'item.supplier.fantasyName' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => BORROW_STATUS_LABELS[value as keyof typeof BORROW_STATUS_LABELS] || value },
      { key: 'createdAt', label: 'Data de Empréstimo', path: 'createdAt', format: 'date' },
      { key: 'returnedAt', label: 'Devolvido Em', path: 'returnedAt', format: 'date' },
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
