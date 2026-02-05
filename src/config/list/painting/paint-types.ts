import type { ListConfig } from '@/components/list/types'
import type { PaintType } from '@/types'
import { canEditPaints } from '@/utils/permissions/entity-permissions'

export const paintTypesListConfig: ListConfig<PaintType> = {
  key: 'painting-paint-types',
  title: 'Tipos de Tinta',

  query: {
    hook: 'usePaintTypesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      _count: {
        select: {
          paints: true,
          componentItems: true,
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
        width: 2.5,
        align: 'left',
        render: (paintType) => paintType.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'needGround',
        label: 'NECESSITA PRIMER',
        sortable: true,
        width: 1.3,
        align: 'center',
        render: (paintType) => paintType.needGround,
        format: 'boolean',
      },
      {
        key: 'paintsCount',
        label: 'TINTAS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (paintType) => String((paintType as any)._count?.paints || 0),
        format: 'count-badge',
      },
      {
        key: 'componentItemsCount',
        label: 'COMPONENTES',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (paintType) => String((paintType as any)._count?.componentItems || 0),
        format: 'count-badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (paintType) => paintType.createdAt || '-',
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'needGround', 'paintsCount'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (paintType, router) => {
          router.push(`/pintura/tipos-de-tinta/detalhes/${paintType.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (paintType, router) => {
          router.push(`/pintura/tipos-de-tinta/editar/${paintType.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (paintType) => `Deseja excluir o tipo de tinta "${paintType.name}"?`,
        },
        onPress: async (paintType, _, context) => {
          await context?.delete?.(paintType.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'needGround',
        label: 'Necessita Primer',
        type: 'toggle',
        placeholder: 'Necessita Primer',
        description: 'Apenas tipos que necessitam primer',
      },
      {
        key: 'hasPaints',
        label: 'Com Tintas',
        type: 'toggle',
        placeholder: 'Com Tintas',
        description: 'Apenas tipos com tintas cadastradas',
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
    placeholder: 'Buscar tipos de tinta...',
    debounce: 500,
  },

  export: {
    title: 'Tipos de Tinta',
    filename: 'tipos-de-tinta',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'needGround', label: 'Necessita Primer', path: 'needGround', format: 'boolean' },
      { key: 'paintsCount', label: 'Tintas', path: '_count.paints' },
      { key: 'componentItemsCount', label: 'Componentes', path: '_count.componentItems' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Tipo de Tinta',
      route: '/pintura/tipos-de-tinta/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'tipo de tinta' : 'tipos de tinta'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
