import type { ListConfig } from '@/components/list/types'
import type { Item } from '@/types'
import { ITEM_CATEGORY_TYPE} from '@/constants'
import { routes } from '@/constants'
import { routeToMobilePath } from '@/utils/route-mapper'
import { canEditItems } from '@/utils/permissions/entity-permissions'

export const ppeItemsListConfig: ListConfig<Item> = {
  key: 'inventory-ppe-items',
  title: 'EPIs',

  query: {
    hook: 'useItemsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      brand: true,
      category: true,
      supplier: true,
      measures: true,
    },
    where: {
      category: {
        type: ITEM_CATEGORY_TYPE.PPE,
      },
    },
  },

  table: {
    columns: [
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
        key: 'ppeType',
        label: 'TIPO EPI',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (item) => item.category?.name || '-',
      },
      {
        key: 'ppeSize',
        label: 'TAMANHO',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (item) => {
          if (!item.measures || item.measures.length === 0) return '-'
          return item.measures
            .map((m) => `${m.value || ''}${m.unit || ''}`)
            .join(' × ')
        },
      },
      {
        key: 'ppeCA',
        label: 'CA',
        sortable: true,
        width: 1.2,
        align: 'left',
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
        key: 'brand.name',
        label: 'MARCA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (item) => item.brand?.name || '-',
      },
      {
        key: 'shouldAssignToUser',
        label: 'ATRIBUIR',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => (item.shouldAssignToUser ? 'Sim' : 'Não'),
      },
      {
        key: 'isActive',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => (item.isActive ? 'ACTIVE' : 'INACTIVE'),
        format: 'badge',
      },
    ],
    defaultVisible: ['name', 'ppeType', 'ppeSize', 'quantity'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (item, router) => {
          router.push(routeToMobilePath(routes.inventory.ppe.detail(item.id)) as any)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (item, router) => {
          router.push(routeToMobilePath(routes.inventory.ppe.edit(item.id)) as any)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Excluir EPI',
          message: 'Tem certeza que deseja excluir este EPI?',
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
        },
        onPress: async (item, _router, { deleteEntity }) => {
          await deleteEntity(item.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Ativo', value: 'true' },
          { label: 'Inativo', value: 'false' },
        ],
        placeholder: 'Selecione os status',
      },
      {
        key: 'categoryIds',
        label: 'Categorias',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['categories', 'filter', 'ppe'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getCategories } = await import('@/api-client')
            const pageSize = 20
            const response = await getCategories({
              where: {
                type: 'PPE',
                ...(searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : {}),
              },
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((category: any) => ({
                label: category.name,
                value: category.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Category Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as categorias',
      },
      {
        key: 'brandIds',
        label: 'Marcas',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['brands', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getBrands } = await import('@/api-client')
            const pageSize = 20
            const response = await getBrands({
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
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as marcas',
      },
      {
        key: 'supplierIds',
        label: 'Fornecedores',
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
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os fornecedores',
      },
      {
        key: 'shouldAssignToUser',
        label: 'Atribuição ao Usuário',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Sim', value: 'true' },
          { label: 'Não', value: 'false' },
        ],
        placeholder: 'Selecione a atribuição',
      },
      {
        key: 'stockLevel',
        label: 'Nível de Estoque',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Normal', value: 'NORMAL' },
          { label: 'Baixo', value: 'LOW' },
          { label: 'Crítico', value: 'CRITICAL' },
          { label: 'Sem Estoque', value: 'OUT_OF_STOCK' },
        ],
        placeholder: 'Selecione os níveis de estoque',
      },
    ],
  },

  search: {
    placeholder: 'Buscar EPIs por nome, código, CA...',
    debounce: 300,
  },

  export: {
    title: 'Exportar EPIs',
    filename: 'epis',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'uniCode', label: 'Código' },
      { key: 'ppeCA', label: 'CA' },
      { key: 'category.name', label: 'Categoria' },
      { key: 'brand.name', label: 'Marca' },
      { key: 'quantity', label: 'Quantidade' },
      { key: 'shouldAssignToUser', label: 'Atribuir ao Usuário' },
      { key: 'isActive', label: 'Ativo' },
      { key: 'createdAt', label: 'Data de Criação' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar EPI',
      route: routeToMobilePath(routes.inventory.ppe.create),
      canCreate: canEditItems,
    },
    bulk: [
      {
        key: 'activate',
        label: 'Ativar Selecionados',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Ativar EPIs',
          message: 'Deseja ativar os EPIs selecionados?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, { isActive: true })
        },
      },
      {
        key: 'deactivate',
        label: 'Desativar Selecionados',
        icon: 'x',
        variant: 'destructive',
        confirm: {
          title: 'Desativar EPIs',
          message: 'Deseja desativar os EPIs selecionados?',
        },
        action: async (ids, { updateEntities }) => {
          await updateEntities(ids, { isActive: false })
        },
      },
      {
        key: 'delete',
        label: 'Excluir Selecionados',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Excluir EPIs',
          message: 'Deseja excluir permanentemente os EPIs selecionados?',
        },
        action: async (ids, { deleteEntities }) => {
          await deleteEntities(ids)
        },
      },
    ],
  },
}
