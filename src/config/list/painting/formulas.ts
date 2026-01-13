import type { ListConfig } from '@/components/list/types'
import type { PaintFormula } from '@/types'
import { SECTOR_PRIVILEGES } from '@/constants/enums'
import { canEditPaintFormulas } from '@/utils/permissions/entity-permissions'

// Helper function to check if user is NOT a warehouse user
const canViewPrices = (user: any) => user?.sector?.privileges !== SECTOR_PRIVILEGES.WAREHOUSE


export const formulasListConfig: ListConfig<PaintFormula> = {
  key: 'painting-formulas',
  title: 'Fórmulas de Tinta',

  query: {
    hook: 'usePaintFormulasInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    sortOptions: [
      { field: 'createdAt', label: 'Data de Criação' },
      { field: 'pricePerLiter', label: 'Preço por Litro' },
      { field: 'density', label: 'Densidade' },
    ],
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
        },
      },
      _count: {
        select: {
          components: true,
          paintProduction: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'paint',
        label: 'TINTA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (formula) => formula.paint?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'code',
        label: 'CÓDIGO',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (formula) => formula.paint?.code || '-',
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (formula) => formula.description || '-',
      },
      {
        key: 'paintType',
        label: 'TIPO',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (formula) => formula.paint?.paintType?.name || '-',
      },
      {
        key: 'paintBrand',
        label: 'MARCA',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (formula) => formula.paint?.paintBrand?.name || '-',
      },
      {
        key: 'components',
        label: 'COMPONENTES',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (formula) => String((formula as any)._count?.components || 0),
        format: 'count-badge',
      },
      {
        key: 'density',
        label: 'DENSIDADE',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (formula) => {
          if (!formula.density || Number(formula.density) === 0) return '-'
          return `${Number(formula.density).toFixed(2)} g/ml`
        },
      },
      {
        key: 'pricePerLiter',
        label: 'PREÇO/LITRO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (formula) => {
          if (!formula.pricePerLiter || Number(formula.pricePerLiter) === 0) return '-'
          return Number(formula.pricePerLiter)
        },
        format: 'currency',
        canView: canViewPrices,
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (formula) => formula.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['paint', 'paintType', 'components'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (formula, router) => {
          if (formula.id) {
            router.push(`/pintura/formulas/detalhes/${formula.id}`)
          }
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (formula, router) => {
          if (formula.id) {
            router.push(`/pintura/formulas/editar/${formula.id}`)
          }
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (formula) => {
            const paintName = formula.paint?.name || 'esta fórmula'
            return `Deseja excluir a fórmula de "${paintName}"?`
          },
        },
        onPress: async (formula, _, { delete: deleteFormula }) => {
          await deleteFormula(formula.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'sortBy',
        label: 'Ordenar por',
        type: 'select',
        multiple: false,
        placeholder: 'Selecione a ordenação',
        options: [
          { label: 'Data de Criação', value: 'createdAt' },
          { label: 'Preço por Litro', value: 'pricePerLiter' },
          { label: 'Densidade', value: 'density' },
        ],
      },
      {
        key: 'sortOrder',
        label: 'Ordem',
        type: 'select',
        multiple: false,
        placeholder: 'Selecione a ordem',
        options: [
          { label: 'Crescente', value: 'asc' },
          { label: 'Decrescente', value: 'desc' },
        ],
      },
      {
        key: 'paintTypeIds',
        label: 'Tipos de Tinta',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['paint-types', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getPaintTypes } = await import('@/api-client')
            const pageSize = 20
            const response = await getPaintTypes({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((type: any) => ({
                label: type.name,
                value: type.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Paint Type Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os tipos de tinta',
      },
      {
        key: 'paintBrandIds',
        label: 'Marcas de Tinta',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['paint-brands', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getPaintBrands } = await import('@/api-client')
            const pageSize = 20
            const response = await getPaintBrands({
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
            console.error('[Paint Brand Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as marcas de tinta',
      },
      {
        key: 'pricePerLiter',
        label: 'Preço por Litro',
        type: 'number-range',
        placeholder: { min: 'Preço Mín (R$)', max: 'Preço Máx (R$)' },
        canView: canViewPrices,
      },
      {
        key: 'density',
        label: 'Densidade',
        type: 'number-range',
        placeholder: { min: 'Densidade Mín (g/ml)', max: 'Densidade Máx (g/ml)' },
      },
      {
        key: 'createdAt',
        label: 'Data de Cadastro',
        type: 'date-range',
        placeholder: 'Data de Cadastro',
      },
    ],
  },

  search: {
    placeholder: 'Buscar fórmulas...',
    debounce: 500,
  },

  export: {
    title: 'Fórmulas de Tinta',
    filename: 'formulas-tinta',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'paint', label: 'Tinta', path: 'paint.name' },
      { key: 'code', label: 'Código', path: 'paint.code' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'paintType', label: 'Tipo', path: 'paint.paintType.name' },
      { key: 'paintBrand', label: 'Marca', path: 'paint.paintBrand.name' },
      { key: 'components', label: 'Componentes', path: '_count.components' },
      { key: 'density', label: 'Densidade (g/ml)', path: 'density' },
      { key: 'pricePerLiter', label: 'Preço/Litro', path: 'pricePerLiter', format: 'currency' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Fórmula',
      route: '/pintura/formulas/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'fórmula' : 'fórmulas'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
