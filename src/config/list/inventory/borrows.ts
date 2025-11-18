import type { ListConfig } from '@/components/list/types'
import type { Borrow } from '@/types'
import {
  BORROW_STATUS,
  BORROW_STATUS_LABELS,
} from '@/constants'
import { canEditBorrows } from '@/utils/permissions/entity-permissions'

export const borrowsListConfig: ListConfig<Borrow> = {
  key: 'inventory-borrows',
  title: 'Empréstimos',

  query: {
    hook: 'useBorrowsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: {
        include: {
          brand: true,
          category: true,
        },
      },
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (borrow) => borrow.item?.uniCode || '-',
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
        key: 'user.name',
        label: 'USUÁRIO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (borrow) => borrow.user?.name || '-',
        style: { fontWeight: '500' },
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
    defaultVisible: ['user.name', 'item.name', 'status'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (borrow, router) => {
          router.push(`/estoque/emprestimos/detalhes/${borrow.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (borrow, router) => {
          router.push(`/estoque/emprestimos/editar/${borrow.id}`)
        },
        condition: (borrow) => borrow.status === BORROW_STATUS.ACTIVE,
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
              quantityReturned: borrow.quantity,
            },
          })
        },
        condition: (borrow) => borrow.status === BORROW_STATUS.ACTIVE,
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
        condition: (borrow) => borrow.status === BORROW_STATUS.ACTIVE,
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (borrow) => `Deseja excluir o empréstimo do item "${borrow.item?.name}" para "${borrow.user?.name}"?`,
        },
        onPress: async (borrow, _, { delete: deleteBorrow }) => {
          await deleteBorrow(borrow.id)
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
            key: 'statusIds',
            label: 'Status do Empréstimo',
            type: 'select',
            multiple: true,
            options: Object.values(BORROW_STATUS).map((status) => ({
              label: BORROW_STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Usuários e Itens',
        icon: 'users',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'userIds',
            label: 'Usuários',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Load from API
              return []
            },
            placeholder: 'Selecione os usuários',
          },
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
        key: 'ranges',
        label: 'Faixas de Valores',
        icon: 'sliders',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'quantityRange',
            label: 'Quantidade',
            type: 'number-range',
            placeholder: { min: 'Mín', max: 'Máx' },
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
            label: 'Data de Empréstimo',
            type: 'date-range',
          },
          {
            key: 'returnedAt',
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
    placeholder: 'Buscar por item ou usuário...',
    debounce: 300,
  },

  export: {
    title: 'Empréstimos',
    filename: 'emprestimos',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'uniCode', label: 'Código', path: 'item.uniCode' },
      { key: 'itemName', label: 'Item', path: 'item.name' },
      { key: 'category', label: 'Categoria', path: 'item.category.name' },
      { key: 'brand', label: 'Marca', path: 'item.brand.name' },
      { key: 'userName', label: 'Usuário', path: 'user.name' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'quantityReturned', label: 'Quantidade Devolvida', path: 'quantityReturned', format: 'number' },
      { key: 'status', label: 'Status', path: 'status', format: 'enum', enumLabels: BORROW_STATUS_LABELS },
      { key: 'createdAt', label: 'Emprestado Em', path: 'createdAt', format: 'date' },
      { key: 'returnedAt', label: 'Devolvido Em', path: 'returnedAt', format: 'date' },
      { key: 'reason', label: 'Motivo', path: 'reason' },
      { key: 'notes', label: 'Observações', path: 'notes' },
      { key: 'conditionNotes', label: 'Condição', path: 'conditionNotes' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Empréstimo',
      route: '/estoque/emprestimos/cadastrar',
      canCreate: canEditBorrows,
    },
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
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'empréstimo' : 'empréstimos'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
