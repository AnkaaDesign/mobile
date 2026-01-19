import type { ListConfig } from '@/components/list/types'
import type { Paint } from '@/types'
import { canEditPaints } from '@/utils/permissions/entity-permissions'


export const catalogListConfig: ListConfig<Paint> = {
  key: 'painting-catalog',
  title: 'Catálogo de Tintas',

  query: {
    hook: 'usePaintsInfiniteMobile',
    defaultSort: { field: 'colorOrder', direction: 'asc' },
    pageSize: 25,
    include: {
      paintType: true,
      paintBrand: true,
      formulas: true,
      _count: {
        select: {
          logoTasks: true,
          generalPaintings: true,
          formulas: true,
        },
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
        render: (paint) => paint.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'colorOrder',
        label: 'COR',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (paint) => paint.hex,
        format: 'color',
      },
      {
        key: 'code',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (paint) => paint.code || '-',
      },
      {
        key: 'paintType',
        label: 'TIPO',
        sortable: true,
        sortField: 'paintType.name',
        width: 1.5,
        align: 'left',
        render: (paint) => paint.paintType?.name || '-',
      },
      {
        key: 'paintBrand',
        label: 'MARCA',
        sortable: true,
        sortField: 'paintBrand.name',
        width: 1.5,
        align: 'left',
        render: (paint) => paint.paintBrand?.name || '-',
      },
      {
        key: 'finish',
        label: 'ACABAMENTO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (paint) => paint.finish || '-',
        format: 'badge',
      },
      {
        key: 'manufacturer',
        label: 'MONTADORA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (paint) => paint.manufacturer || '-',
        format: 'badge',
      },
      {
        key: 'formulasCount',
        label: 'FÓRMULAS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (paint) => String((paint as any)._count?.formulas || 0),
        format: 'count-badge',
      },
      {
        key: 'usageCount',
        label: 'USO',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (paint) => {
          const count = (paint as any)._count
          return (count?.logoTasks || 0) + (count?.generalPaintings || 0)
        },
        format: 'badge',
      },
      {
        key: 'tags',
        label: 'TAGS',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (paint) => paint.tags?.join(', ') || '-',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (paint) => paint.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'color', 'code'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (paint, router) => {
          router.push(`/pintura/catalogo/detalhes/${paint.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (paint, router) => {
          router.push(`/pintura/catalogo/editar/${paint.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (paint) => `Deseja excluir a tinta "${paint.name}"?`,
        },
        onPress: async (paint, _, { delete: deletePaint }) => {
          await deletePaint(paint.id)
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
        key: 'finishes',
        label: 'Acabamento',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Lisa', value: 'SOLID' },
          { label: 'Metálico', value: 'METALLIC' },
          { label: 'Perolizado', value: 'PEARL' },
          { label: 'Fosco', value: 'MATTE' },
          { label: 'Semi Brilho', value: 'SATIN' },
        ],
        placeholder: 'Selecione os acabamentos',
      },
      {
        key: 'hasFormulas',
        label: 'Apenas com fórmulas',
        type: 'boolean',
        placeholder: 'Apenas com fórmulas',
        description: 'Mostrar apenas tintas que possuem fórmulas cadastradas',
      },
      {
        key: 'manufacturers',
        label: 'Montadora',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Volkswagen', value: 'VOLKSWAGEN' },
          { label: 'Mercedes-Benz', value: 'MERCEDES_BENZ' },
          { label: 'Scania', value: 'SCANIA' },
          { label: 'Volvo', value: 'VOLVO' },
          { label: 'Iveco', value: 'IVECO' },
          { label: 'DAF', value: 'DAF' },
          { label: 'MAN', value: 'MAN' },
          { label: 'Ford', value: 'FORD' },
          { label: 'Agrale', value: 'AGRALE' },
          { label: 'Outro', value: 'OTHER' },
        ],
        placeholder: 'Selecione as montadoras',
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
    placeholder: 'Buscar por nome, código hex, marca, tags...',
    debounce: 300,
  },

  export: {
    title: 'Catálogo de Tintas',
    filename: 'catalogo-tintas',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'code', label: 'Código', path: 'code' },
      { key: 'paintType', label: 'Tipo', path: 'paintType.name' },
      { key: 'paintBrand', label: 'Marca', path: 'paintBrand.name' },
      { key: 'finish', label: 'Acabamento', path: 'finish' },
      { key: 'formulasCount', label: 'Fórmulas', path: '_count.formulas' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Tinta',
      route: '/pintura/catalogo/cadastrar',
      canCreate: canEditPaints,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'tinta' : 'tintas'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
