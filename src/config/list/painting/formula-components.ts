import type { ListConfig } from '@/components/list/types'
import type { PaintFormulaComponent } from '@/types'
import { canEditPaintFormulas } from '@/utils/permissions/entity-permissions'


/**
 * Factory function for Paint Formula Components list config
 * Accepts formulaId as parameter for nested route support
 */
export function createFormulaComponentsListConfig(
  formulaId: string
): ListConfig<PaintFormulaComponent> {
  return {
    key: `painting-formula-components-${formulaId}`,
    title: 'Componentes da Fórmula',

    query: {
      hook: 'usePaintFormulaComponentsInfinite',
      defaultSort: { field: 'ratio', direction: 'desc' },
      pageSize: 25,
      include: {
        item: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      // Base where clause to filter by formulaId
      where: {
        formulaPaintId: formulaId,
      },
    },

    table: {
      columns: [
        {
          key: 'itemName',
          label: 'ITEM',
          sortable: false,
          width: 2.0,
          align: 'left',
          render: (component) => component.item?.name || 'Item não encontrado',
          style: { fontWeight: '500' },
        },
        {
          key: 'itemCode',
          label: 'CÓDIGO',
          sortable: false,
          width: 1.0,
          align: 'left',
          render: (component) => component.item?.uniCode || '-',
        },
        {
          key: 'ratio',
          label: 'PROPORÇÃO',
          sortable: true,
          width: 1.0,
          align: 'right',
          render: (component) => `${component.ratio.toFixed(2)}%`,
          style: { fontWeight: '600' },
        },
        {
          key: 'weight',
          label: 'PESO (g)',
          sortable: true,
          width: 1.0,
          align: 'right',
          render: (component) => {
            if (!component.weight || Number(component.weight) === 0) return '-'
            return `${Number(component.weight).toFixed(2)}g`
          },
        },
        {
          key: 'brand',
          label: 'MARCA',
          sortable: false,
          width: 1.2,
          align: 'left',
          render: (component) => component.item?.brand?.name || '-',
        },
        {
          key: 'category',
          label: 'CATEGORIA',
          sortable: false,
          width: 1.2,
          align: 'left',
          render: (component) => component.item?.category?.name || '-',
        },
        {
          key: 'createdAt',
          label: 'ADICIONADO EM',
          sortable: true,
          width: 1.2,
          align: 'left',
          render: (component) => component.createdAt,
          format: 'date',
        },
      ],
      defaultVisible: ['itemName', 'ratio', 'weight'],
      rowHeight: 72,
      actions: [
        {
          key: 'view',
          label: 'Visualizar',
          icon: 'eye',
          variant: 'default',
          onPress: (component, router) => {
            router.push(`/pintura/formulas/${formulaId}/componentes/detalhes/${component.id}`)
          },
        },
        {
          key: 'edit',
          label: 'Editar',
          icon: 'pencil',
          variant: 'default',
          onPress: (component, router) => {
            router.push(`/pintura/formulas/${formulaId}/componentes/editar/${component.id}`)
          },
        },
        {
          key: 'delete',
          label: 'Excluir',
          icon: 'trash',
          variant: 'destructive',
          confirm: {
            title: 'Remover Componente',
            message: (component) => {
              const itemName = component.item?.name || 'este item'
              return `Tem certeza que deseja remover "${itemName}" da fórmula? Esta ação não pode ser desfeita.`
            },
          },
          onPress: async (component, _, { delete: deleteComponent }) => {
            await deleteComponent(component.id)
          },
        },
      ],
    },

    filters: {
      fields: [
        {
          key: 'brandIds',
          label: 'Marcas',
          type: 'select',
          multiple: true,
          async: true,
          queryKey: ['brands', 'filter'],
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
              return { data: [], hasMore: false }
            }
          },
          placeholder: 'Selecione as marcas',
        },
        {
          key: 'categoryIds',
          label: 'Categorias',
          type: 'select',
          multiple: true,
          async: true,
          queryKey: ['categories', 'filter'],
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
          key: 'ratio',
          label: 'Proporção',
          type: 'number-range',
          placeholder: { min: 'Proporção Mín (%)', max: 'Proporção Máx (%)' },
          min: 0,
          max: 100,
          step: 0.1,
        },
        {
          key: 'weight',
          label: 'Peso',
          type: 'number-range',
          placeholder: { min: 'Peso Mín (g)', max: 'Peso Máx (g)' },
          min: 0,
          step: 0.1,
        },
        {
          key: 'createdAt',
          label: 'Data de Adição',
          type: 'date-range',
          placeholder: 'Data de Adição',
        },
      ],
    },

    search: {
      placeholder: 'Buscar componentes...',
      debounce: 300,
    },

    export: {
      title: 'Componentes da Fórmula',
      filename: 'componentes-formula',
      formats: ['csv', 'json', 'pdf'],
      columns: [
        { key: 'itemName', label: 'Item', path: 'item.name' },
        { key: 'itemCode', label: 'Código', path: 'item.uniCode' },
        { key: 'ratio', label: 'Proporção (%)', path: 'ratio' },
        { key: 'weight', label: 'Peso (g)', path: 'weight' },
        { key: 'brand', label: 'Marca', path: 'item.brand.name' },
        { key: 'category', label: 'Categoria', path: 'item.category.name' },
        { key: 'createdAt', label: 'Adicionado em', path: 'createdAt', format: 'date' },
      ],
    },

    actions: {
      create: {
        label: 'Adicionar Componente',
        route: `/pintura/formulas/${formulaId}/componentes/cadastrar`,
        canCreate: canEditPaintFormulas,
      },
      bulk: [
        {
          key: 'delete',
          label: 'Excluir',
          icon: 'trash',
          variant: 'destructive',
          confirm: {
            title: 'Confirmar Exclusão',
            message: (count) =>
              `Deseja excluir ${count} ${count === 1 ? 'componente' : 'componentes'}?`,
          },
          onPress: async (ids, { batchDeleteAsync }) => {
            await batchDeleteAsync({ ids: Array.from(ids) })
          },
        },
      ],
    },

    emptyState: {
      icon: 'flask',
      title: 'Nenhum componente encontrado',
      description: 'Adicione componentes para criar esta fórmula',
    },
  }
}
