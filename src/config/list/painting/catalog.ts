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
        key: 'color',
        label: 'COR',
        sortable: false,
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
        key: 'manufacturer',
        label: 'MONTADORA',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (paint) => paint.manufacturer || '-',
        format: 'badge',
      },
      {
        key: 'palette',
        label: 'PALETA',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (paint) => paint.palette || '-',
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
    defaultVisible: ['name', 'color', 'paintType', 'finish'],
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
        label: 'Acabamento e Características',
        icon: 'sparkles',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'finishes',
            label: 'Acabamento',
            type: 'select',
            multiple: true,
            options: [
              { label: 'Sólido', value: 'SOLID' },
              { label: 'Metálico', value: 'METALLIC' },
              { label: 'Perolizado', value: 'PEARL' },
              { label: 'Fosco', value: 'MATTE' },
              { label: 'Acetinado', value: 'SATIN' },
              { label: 'Semi-brilho', value: 'SEMI_GLOSS' },
              { label: 'Brilhante', value: 'GLOSS' },
              { label: 'Alto Brilho', value: 'HIGH_GLOSS' },
            ],
            placeholder: 'Selecione os acabamentos',
          },
          {
            key: 'hasFormulas',
            label: 'Apenas com fórmulas',
            type: 'boolean',
            description: 'Mostrar apenas tintas que possuem fórmulas cadastradas',
          },
        ],
      },
      {
        key: 'manufacturer',
        label: 'Montadora',
        icon: 'truck',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'manufacturers',
            label: 'Montadoras',
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
        ],
      },
      {
        key: 'palette',
        label: 'Paleta de Cores',
        icon: 'palette',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'palettes',
            label: 'Paletas',
            type: 'select',
            multiple: true,
            options: [
              { label: 'Branco', value: 'WHITE' },
              { label: 'Preto', value: 'BLACK' },
              { label: 'Cinza', value: 'GRAY' },
              { label: 'Prata', value: 'SILVER' },
              { label: 'Vermelho', value: 'RED' },
              { label: 'Azul', value: 'BLUE' },
              { label: 'Verde', value: 'GREEN' },
              { label: 'Amarelo', value: 'YELLOW' },
              { label: 'Laranja', value: 'ORANGE' },
              { label: 'Marrom', value: 'BROWN' },
              { label: 'Bege', value: 'BEIGE' },
              { label: 'Dourado', value: 'GOLDEN' },
              { label: 'Rosa', value: 'PINK' },
              { label: 'Roxo', value: 'PURPLE' },
            ],
            placeholder: 'Selecione as paletas',
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
