import type { ListConfig } from '@/components/list/types'
import type { Paint } from '@/types'

export const catalogListConfig: ListConfig<Paint> = {
  key: 'painting-catalog',
  title: 'Catálogo de Tintas',

  query: {
    hook: 'usePaintsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
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
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (paint) => paint.paintType?.name || '-',
      },
      {
        key: 'paintBrand',
        label: 'MARCA',
        sortable: false,
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
        key: 'formulasCount',
        label: 'FÓRMULAS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (paint) => (paint as any)._count?.formulas || 0,
        format: 'badge',
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
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (paint) => paint.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'code', 'paintType'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
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
    sections: [
      {
        key: 'type',
        label: 'Tipo e Marca',
        icon: 'tag',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'paintTypeIds',
            label: 'Tipos de Tinta',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os tipos',
          },
          {
            key: 'paintBrandIds',
            label: 'Marcas de Tinta',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione as marcas',
          },
        ],
      },
      {
        key: 'finish',
        label: 'Acabamento',
        icon: 'sparkles',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'finish',
            label: 'Acabamento',
            type: 'select',
            multiple: true,
            options: [
              { label: 'Fosco', value: 'MATTE' },
              { label: 'Acetinado', value: 'SATIN' },
              { label: 'Semi-brilho', value: 'SEMI_GLOSS' },
              { label: 'Brilhante', value: 'GLOSS' },
              { label: 'Alto Brilho', value: 'HIGH_GLOSS' },
            ],
            placeholder: 'Selecione o acabamento',
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
            label: 'Data de Cadastro',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar tintas...',
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
