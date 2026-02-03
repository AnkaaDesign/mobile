import type { ListConfig } from '@/components/list/types'
import type { Borrow } from '@/types'
import {
  BORROW_STATUS,
  BORROW_STATUS_LABELS,
} from '@/constants'


export const myTeamBorrowsListConfig: ListConfig<Borrow> = {
  key: 'my-team-borrows',
  title: 'Empréstimos da Equipe',

  query: {
    hook: 'useTeamStaffBorrowsInfiniteMobile',
    defaultSort: { field: 'status', direction: 'asc' },
    pageSize: 20,
    select: {
      id: true,
      quantity: true,
      status: true,
      statusOrder: true,
      returnedAt: true,
      createdAt: true,
      updatedAt: true,
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
          supplier: {
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
        key: 'user.name',
        label: 'USUÁRIO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (borrow) => borrow.user?.name || '-',
        style: { fontWeight: '500' },
      },
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
        width: 1.3,
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
        key: 'item.supplier.name',
        label: 'FORNECEDOR',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.supplier?.name || '-',
      },
      {
        key: 'user.position.name',
        label: 'CARGO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (borrow) => borrow.user?.position?.name || '-',
      },
      {
        key: 'user.sector.name',
        label: 'SETOR',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (borrow) => borrow.user?.sector?.name || '-',
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
    defaultVisible: ['user.name', 'item.name', 'status'],
    rowHeight: 72,
    onRowPress: (borrow, router) => {
      router.push(`/estoque/emprestimos/detalhes/${borrow.id}` as any)
    },
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (borrow, router) => {
          router.push(`/estoque/emprestimos/detalhes/${borrow.id}` as any)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (borrow, router) => {
          router.push(`/estoque/emprestimos/editar/${borrow.id}` as any)
        },
        visible: (borrow) => borrow.status === BORROW_STATUS.ACTIVE,
      },
      {
        key: 'return',
        label: 'Devolver',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Devolução',
          message: (borrow) => `Confirma a devolução do item "${borrow.item?.name}"?`,
        },
        onPress: async (borrow, _, { update }) => {
          await update({
            id: borrow.id,
            data: {
              status: BORROW_STATUS.RETURNED,
              returnedAt: new Date(),
            },
          })
        },
        visible: (borrow) => borrow.status === BORROW_STATUS.ACTIVE,
      },
      {
        key: 'mark-lost',
        label: 'Marcar como Perdido',
        icon: 'alert-circle',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Perda',
          message: (borrow) => `Tem certeza que deseja marcar o item "${borrow.item?.name}" como perdido? Esta ação é irreversível.`,
        },
        onPress: async (borrow, _, { update }) => {
          await update({
            id: borrow.id,
            data: {
              status: BORROW_STATUS.LOST,
            },
          })
        },
        visible: (borrow) => borrow.status === BORROW_STATUS.ACTIVE,
      },
    ],
  },

  filters: {
    defaultValues: {},
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
        key: 'userIds',
        label: 'Usuários',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'team'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((user: any) => ({
                label: user.name,
                value: user.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os usuários',
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
    title: 'Empréstimos da Equipe',
    filename: 'emprestimos-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'userName', label: 'Usuário', path: 'user.name' },
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'uniCode', label: 'Código', path: 'item.uniCode' },
      { key: 'category', label: 'Categoria', path: 'item.category.name' },
      { key: 'brand', label: 'Marca', path: 'item.brand.name' },
      { key: 'supplier', label: 'Fornecedor', path: 'item.supplier.name' },
      { key: 'position', label: 'Cargo', path: 'user.position.name' },
      { key: 'sector', label: 'Setor', path: 'user.sector.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => BORROW_STATUS_LABELS[value] || value },
      { key: 'createdAt', label: 'Emprestado Em', path: 'createdAt', format: 'date' },
      { key: 'returnedAt', label: 'Devolvido Em', path: 'returnedAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  // No create/edit actions for team borrows - managed elsewhere
  actions: {
    bulk: [
      {
        key: 'return',
        label: 'Devolver Selecionados',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Devolução em Lote',
          message: (count) => `Deseja devolver ${count} ${count === 1 ? 'empréstimo' : 'empréstimos'}?`,
        },
        onPress: async (ids, { batchUpdateAsync }) => {
          const updates = Array.from(ids).map((id) => ({
            id,
            data: {
              status: BORROW_STATUS.RETURNED,
              returnedAt: new Date(),
            },
          }))
          await batchUpdateAsync({ borrows: updates })
        },
      },
      {
        key: 'mark-lost',
        label: 'Marcar como Perdido',
        icon: 'alert-circle',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Perda em Lote',
          message: (count) => `Deseja marcar ${count} ${count === 1 ? 'empréstimo' : 'empréstimos'} como perdido(s)?`,
        },
        onPress: async (ids, { batchUpdateAsync }) => {
          const updates = Array.from(ids).map((id) => ({
            id,
            data: {
              status: BORROW_STATUS.LOST,
            },
          }))
          await batchUpdateAsync({ borrows: updates })
        },
      },
    ],
  },

  permissions: {
    // Note: Team leadership is now determined by managedSector, checked at component level
    view: 'TEAM_LEADER',
  },

  emptyState: {
    icon: 'package',
    title: 'Nenhum empréstimo encontrado',
    description: 'Os empréstimos da sua equipe aparecerão aqui',
  },
}
