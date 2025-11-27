import type { ListConfig } from '@/components/list/types'
import type { PaintProduction } from '@/types'

export const productionsListConfig: ListConfig<PaintProduction> = {
  key: 'painting-productions',
  title: 'Produções de Tinta',

  query: {
    hook: 'usePaintProductionsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      formula: {
        include: {
          paint: {
            include: {
              paintType: true,
              paintBrand: true,
            },
          },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'paintName',
        label: 'TINTA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (production) => (production as any).formula?.paint?.name || 'Tinta',
        style: { fontWeight: '500' },
      },
      {
        key: 'paintCode',
        label: 'CÓDIGO',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (production) => (production as any).formula?.paint?.code || '-',
      },
      {
        key: 'volumeLiters',
        label: 'VOLUME (L)',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (production) => production.volumeLiters.toFixed(2),
        format: 'badge',
      },
      {
        key: 'formula',
        label: 'FÓRMULA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (production) => (production as any).formula?.description || 'Sem descrição',
      },
      {
        key: 'paintType',
        label: 'TIPO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (production) => (production as any).formula?.paint?.paintType?.name || '-',
      },
      {
        key: 'paintBrand',
        label: 'MARCA',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (production) => (production as any).formula?.paint?.paintBrand?.name || '-',
      },
      {
        key: 'createdAt',
        label: 'PRODUZIDO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (production) => production.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['paintName', 'volumeLiters', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (production, router) => {
          router.push(`/pintura/producoes/detalhes/${production.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (production, router) => {
          router.push(`/pintura/producoes/editar/${production.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (production) => {
            const paintName = (production as any).formula?.paint?.name || 'Esta produção'
            return `Deseja excluir a produção de "${paintName}"?`
          },
        },
        onPress: async (production, _, { delete: deleteProduction }) => {
          await deleteProduction(production.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'paintTypeIds',
        label: 'Tipos de Tinta',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['paintTypes', 'filter'],
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
            console.error('[PaintType Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os tipos de tinta',
      },
      {
        key: 'paintFinishes',
        label: 'Acabamentos',
        type: 'select',
        multiple: true,
        options: [
          { value: 'SOLID', label: 'Lisa' },
          { value: 'METALLIC', label: 'Metálico' },
          { value: 'PEARL', label: 'Perolizado' },
          { value: 'MATTE', label: 'Fosco' },
          { value: 'SATIN', label: 'Semi Brilho' },
        ],
        placeholder: 'Selecione os acabamentos',
      },
      {
        key: 'paintBrands',
        label: 'Marcas de Tinta (Legacy)',
        type: 'select',
        multiple: true,
        options: [
          { value: 'PPG', label: 'PPG' },
          { value: 'FARBEN', label: 'Farben' },
          { value: 'LAZZURIL', label: 'Lazzuril' },
        ],
        placeholder: 'Selecione as marcas (legacy)',
      },
      {
        key: 'paintBrandIds',
        label: 'Marcas de Tinta',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['paintBrands', 'filter'],
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
            console.error('[PaintBrand Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as marcas de tinta',
      },
      {
        key: 'formulaIds',
        label: 'Fórmulas',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['formulas', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getFormulas } = await import('@/api-client')
            const pageSize = 20
            const response = await getFormulas({
              where: searchTerm ? { code: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { code: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((formula: any) => ({
                label: formula.code,
                value: formula.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[Formula Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as fórmulas',
      },
      {
        key: 'volumeRange',
        label: 'Volume',
        type: 'number-range',
        placeholder: {
          min: 'Volume Mín (L)',
          max: 'Volume Máx (L)',
        },
      },
      {
        key: 'createdAt',
        label: 'Data de Produção',
        type: 'date-range',
        placeholder: 'Data de Produção',
      },
    ],
  },

  search: {
    placeholder: 'Buscar produções...',
    debounce: 300,
  },

  export: {
    title: 'Produções de Tinta',
    filename: 'producoes-tinta',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'paintName', label: 'Tinta', path: 'formula.paint.name' },
      { key: 'paintCode', label: 'Código', path: 'formula.paint.code' },
      { key: 'volumeLiters', label: 'Volume (L)', path: 'volumeLiters' },
      { key: 'formula', label: 'Fórmula', path: 'formula.description' },
      { key: 'paintType', label: 'Tipo', path: 'formula.paint.paintType.name' },
      { key: 'paintBrand', label: 'Marca', path: 'formula.paint.paintBrand.name' },
      { key: 'createdAt', label: 'Produzido em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    // Note: Productions are created from the formula detail page, not from this list
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'produção' : 'produções'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
