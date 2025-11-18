import type { ListConfig } from '@/components/list/types'
import type { Cut } from '@/types'
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from '@/constants/enums'
import { canEditCuts } from '@/utils/permissions/entity-permissions'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CUTTING: 'Cortando',
  COMPLETED: 'Concluído',
}

const TYPE_LABELS: Record<string, string> = {
  VINYL: 'Adesivo',
  STENCIL: 'Espovo',
}

const ORIGIN_LABELS: Record<string, string> = {
  PLAN: 'Plano',
  REQUEST: 'Solicitação',
}

export const cutsListConfig: ListConfig<Cut> = {
  key: 'production-cuts',
  title: 'Cortes',

  query: {
    hook: 'useCutsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      file: true,
      task: true,
      parentCut: true,
    },
  },

  table: {
    columns: [
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => cut.status,
        format: 'badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => TYPE_LABELS[cut.type] || cut.type,
      },
      {
        key: 'origin',
        label: 'ORIGEM',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (cut) => ORIGIN_LABELS[cut.origin] || cut.origin,
      },
      {
        key: 'task',
        label: 'TAREFA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.task?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'file',
        label: 'ARQUIVO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (cut) => cut.file?.fileName || cut.file?.key || '-',
      },
      {
        key: 'startedAt',
        label: 'INÍCIO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.startedAt,
        format: 'datetime',
      },
      {
        key: 'completedAt',
        label: 'CONCLUSÃO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.completedAt,
        format: 'datetime',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (cut) => cut.createdAt,
        format: 'datetime',
      },
    ],
    defaultVisible: ['status', 'type', 'task', 'origin'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (cut, router) => {
          router.push(`/producao/recorte/detalhes/${cut.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (cut, router) => {
          router.push(`/producao/recorte/editar/${cut.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir este corte?`,
        },
        onPress: async (cut, _, { delete: deleteCut }) => {
          await deleteCut(cut.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'scissors',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            multiple: true,
            options: Object.values(CUT_STATUS).map((status) => ({
              label: STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'type',
        label: 'Tipo',
        icon: 'tag',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'type',
            label: 'Tipo de Corte',
            type: 'select',
            multiple: true,
            options: Object.values(CUT_TYPE).map((type) => ({
              label: TYPE_LABELS[type],
              value: type,
            })),
            placeholder: 'Selecione os tipos',
          },
        ],
      },
      {
        key: 'origin',
        label: 'Origem',
        icon: 'map-pin',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'origin',
            label: 'Origem do Corte',
            type: 'select',
            multiple: true,
            options: Object.values(CUT_ORIGIN).map((origin) => ({
              label: ORIGIN_LABELS[origin],
              value: origin,
            })),
            placeholder: 'Selecione as origens',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Relacionamentos',
        icon: 'link',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'taskIds',
            label: 'Tarefas',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione as tarefas',
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
            label: 'Data de Criação',
            type: 'date-range',
          },
          {
            key: 'updatedAt',
            label: 'Data de Atualização',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar cortes...',
    debounce: 300,
  },

  export: {
    title: 'Cortes',
    filename: 'cortes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => TYPE_LABELS[value] || value },
      { key: 'origin', label: 'Origem', path: 'origin', format: (value) => ORIGIN_LABELS[value] || value },
      { key: 'task', label: 'Tarefa', path: 'task.name' },
      { key: 'file', label: 'Arquivo', path: 'file.fileName' },
      { key: 'startedAt', label: 'Início', path: 'startedAt', format: 'datetime' },
      { key: 'completedAt', label: 'Conclusão', path: 'completedAt', format: 'datetime' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'datetime' },
    ],
  },

  actions: {
    create: {
      label: 'Novo Corte',
      route: '/producao/recorte/cadastrar',
      canCreate: canEditCuts,
    },
    bulk: [
      {
        key: 'start',
        label: 'Iniciar',
        icon: 'play',
        variant: 'default',
        confirm: {
          title: 'Confirmar Início',
          message: (count) => `Iniciar ${count} ${count === 1 ? 'corte' : 'cortes'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'CUTTING', startedAt: new Date() })
        },
      },
      {
        key: 'complete',
        label: 'Concluir',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Conclusão',
          message: (count) => `Concluir ${count} ${count === 1 ? 'corte' : 'cortes'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'COMPLETED', completedAt: new Date() })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'corte' : 'cortes'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
