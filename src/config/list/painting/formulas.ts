import type { ListConfig } from '@/components/list/types'
import type { PaintFormula } from '@/types'

export const formulasListConfig: ListConfig<PaintFormula> = {
  key: 'painting-formulas',
  title: 'Fórmulas de Tinta',

  query: {
    hook: 'usePaintFormulasInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
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
        render: (formula) => (formula as any)._count?.components || 0,
        format: 'badge',
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
    defaultVisible: ['paint', 'code', 'description', 'components', 'pricePerLiter'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (formula, router) => {
          if (formula.paintId) {
            router.push(`/pintura/catalogo/detalhes/${formula.paintId}`)
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
    sections: [
      {
        key: 'paint',
        label: 'Tinta',
        icon: 'droplet',
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
        key: 'price',
        label: 'Preço',
        icon: 'currency-real',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'pricePerLiter',
            label: 'Preço por Litro',
            type: 'number-range',
            placeholder: { min: 'Mínimo', max: 'Máximo' },
          },
        ],
      },
      {
        key: 'density',
        label: 'Densidade',
        icon: 'flask',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'density',
            label: 'Densidade (g/ml)',
            type: 'number-range',
            placeholder: { min: 'Mínimo', max: 'Máximo' },
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
