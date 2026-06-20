import type { ListConfig } from '@/components/list/types'
import type { WarehouseLocation } from '@/types'
import { canEditWarehouseLocations, canDeleteWarehouseLocations } from '@/utils/permissions/entity-permissions'
import { isTabletWidth } from '@/lib/table-utils'
import { WAREHOUSE_LOCATION_TYPE_LABELS } from '@/constants/enum-labels'

export const warehouseLocationsListConfig: ListConfig<WarehouseLocation> = {
  key: 'inventory-warehouse-locations',
  title: 'Localizações',

  query: {
    hook: 'useWarehouseLocationsInfiniteMobile',
    mutationsHook: 'useWarehouseLocationMutations',
    batchMutationsHook: 'useWarehouseLocationBatchMutations',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      items: true,
      _count: {
        select: {
          items: true,
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
        render: (location: WarehouseLocation) => location.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (location) => (location.type ? WAREHOUSE_LOCATION_TYPE_LABELS[location.type] ?? location.type : '-'),
      },
      {
        key: 'section',
        label: 'SETOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (location) => location.section || '-',
      },
      {
        key: 'code',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (location) => location.code || '-',
      },
      {
        key: 'itemsCount',
        label: 'PRODUTOS',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (location) => String((location as any)._count?.items || 0),
        format: 'count-badge',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (location) => location.createdAt || '-',
        format: 'date',
      },
    ],
    defaultVisible: isTabletWidth()
      ? ['name', 'section', 'code', 'itemsCount']
      : ['name', 'itemsCount'],
    rowHeight: 48,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (location, router) => {
          router.push(`/estoque/localizacoes/detalhes/${location.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditWarehouseLocations,
        onPress: (location, router) => {
          router.push(`/estoque/localizacoes/editar/${location.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteWarehouseLocations,
        confirm: {
          title: 'Confirmar Exclusão',
          message: (location) => `Deseja excluir a localização "${location.name}"?`,
        },
        onPress: async (location, _, context) => {
          await context?.delete?.(location.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'itemCount',
        label: 'Quantidade de Itens',
        type: 'number-range',
        placeholder: { min: 'Mín', max: 'Máx' },
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
    placeholder: 'Buscar localizações...',
    debounce: 500,
  },

  export: {
    title: 'Localizações',
    filename: 'localizacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'section', label: 'Setor', path: 'section' },
      { key: 'code', label: 'Código', path: 'code' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'itemsCount', label: 'Produtos', path: '_count.items' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Localização',
      route: '/estoque/localizacoes/cadastrar',
      canCreate: canEditWarehouseLocations,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'localização' : 'localizações'}?`,
        },
        canPerform: canDeleteWarehouseLocations,
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ warehouseLocationIds: Array.from(ids) })
        },
      },
    ],
  },
}
