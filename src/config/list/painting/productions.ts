import type { ListConfig } from '@/components/list/types'
import type { PaintProduction } from '@/types'
import { canEditPaintProductions } from '@/utils/permissions/entity-permissions'

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
        type: 'select',
        multiple: true,
        placeholder: 'Tipos de Tinta',
      },
      {
        key: 'paintFinishes',
        type: 'select',
        multiple: true,
        options: [
          { value: 'SOLID', label: 'Lisa' },
          { value: 'METALLIC', label: 'Metálico' },
          { value: 'PEARL', label: 'Perolizado' },
          { value: 'MATTE', label: 'Fosco' },
          { value: 'SATIN', label: 'Semi Brilho' },
        ],
        placeholder: 'Acabamentos',
      },
      {
        key: 'paintBrands',
        type: 'select',
        multiple: true,
        options: [
          { value: 'PPG', label: 'PPG' },
          { value: 'FARBEN', label: 'Farben' },
          { value: 'LAZZURIL', label: 'Lazzuril' },
        ],
        placeholder: 'Marcas de Tinta (Legacy)',
      },
      {
        key: 'paintBrandIds',
        type: 'select',
        multiple: true,
        placeholder: 'Marcas de Tinta',
      },
      {
        key: 'formulaIds',
        type: 'select',
        multiple: true,
        placeholder: 'Fórmulas',
      },
      {
        key: 'volumeRange',
        type: 'number-range',
        placeholder: {
          min: 'Volume Mín (L)',
          max: 'Volume Máx (L)',
        },
      },
      {
        key: 'createdAt',
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
    create: {
      label: 'Cadastrar Produção',
      route: '/pintura/producoes/cadastrar',
      canCreate: canEditPaintProductions,
    },
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
