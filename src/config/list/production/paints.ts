import type { ListConfig } from '@/components/list/types'
import type { Paint } from '@/types'
import { canEditPaints } from '@/utils/permissions/entity-permissions'

export const paintsListConfig: ListConfig<Paint> = {
  key: 'production-paints',
  title: 'Tintas',

  query: {
    hook: 'usePaintsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      task: {
        include: {
          customer: true,
        },
      },
      catalogPaint: true,
    },
  },

  table: {
    columns: [
      {
        key: 'task',
        label: 'TAREFA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (paint) => paint.task?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'catalogPaint',
        label: 'TINTA CATÁLOGO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (paint) => paint.catalogPaint?.name || '-',
      },
      {
        key: 'color',
        label: 'COR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (paint) => paint.color || '-',
      },
      {
        key: 'quantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (paint) => String(paint.quantity || 0),
        format: 'number',
      },
      {
        key: 'measureUnit',
        label: 'UNIDADE',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (paint) => paint.measureUnit || '-',
      },
      {
        key: 'customer',
        label: 'CLIENTE',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (paint) => paint.task?.customer?.fantasyName || '-',
      },
      {
        key: 'observations',
        label: 'OBSERVAÇÕES',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (paint) => paint.observations || '-',
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
    defaultVisible: ['task', 'color', 'quantity'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (paint, router) => {
          router.push(`/producao/tintas/detalhes/${paint.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (paint, router) => {
          router.push(`/producao/tintas/editar/${paint.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (paint) => `Deseja excluir esta tinta?`,
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
        key: 'taskId',
        label: 'Tarefa',
        type: 'select',
        multiple: false,
        placeholder: 'Selecione a tarefa',
      },
      {
        key: 'customerId',
        label: 'Cliente',
        type: 'select',
        multiple: false,
        placeholder: 'Selecione o cliente',
      },
      {
        key: 'catalogPaintId',
        label: 'Tinta do Catálogo',
        type: 'select',
        multiple: false,
        placeholder: 'Selecione a tinta',
      },
      {
        key: 'quantityRange',
        label: 'Quantidade',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
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
    placeholder: 'Buscar tintas...',
    debounce: 300,
  },

  export: {
    title: 'Tintas',
    filename: 'tintas',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'catalogPaint', label: 'Tinta Catálogo', path: 'catalogPaint.name' },
      { key: 'color', label: 'Cor', path: 'color' },
      { key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
      { key: 'measureUnit', label: 'Unidade', path: 'measureUnit' },
      { key: 'customer', label: 'Cliente', path: 'task.customer.fantasyName' },
      { key: 'observations', label: 'Observações', path: 'observations' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Tinta',
      route: '/producao/tintas/cadastrar',
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
