import type { ListConfig } from '@/components/list/types'
import type { Maintenance } from '@/types'
import { MAINTENANCE_STATUS } from '@/constants/enums'
import { canEditMaintenance } from '@/utils/permissions/entity-permissions'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  OVERDUE: 'Atrasado',
}

export const maintenanceListConfig: ListConfig<Maintenance> = {
  key: 'inventory-maintenance',
  title: 'Manutenções',

  query: {
    hook: 'useMaintenanceInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: true,
      maintenanceSchedule: true,
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
        render: (maintenance) => maintenance.name,
        style: { fontWeight: '500' },
      },
      {
        key: 'item',
        label: 'ITEM',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (maintenance) => maintenance.item?.name || '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (maintenance) => maintenance.status,
        format: 'badge',
      },
      {
        key: 'scheduledFor',
        label: 'AGENDADO PARA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (maintenance) => maintenance.scheduledFor,
        format: 'date',
      },
      {
        key: 'startedAt',
        label: 'INICIADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (maintenance) => maintenance.startedAt,
        format: 'datetime',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (maintenance) => maintenance.finishedAt,
        format: 'datetime',
      },
      {
        key: 'timeTaken',
        label: 'TEMPO (min)',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (maintenance) => maintenance.timeTaken?.toString() || '-',
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (maintenance) => maintenance.description || '-',
      },
    ],
    defaultVisible: ['name', 'item', 'status', 'scheduledFor'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (maintenance, router) => {
          router.push(`/estoque/manutencao/detalhes/${maintenance.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (maintenance, router) => {
          router.push(`/estoque/manutencao/editar/${maintenance.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (maintenance) => `Deseja excluir a manutenção "${maintenance.name}"?`,
        },
        onPress: async (maintenance, _, { delete: deleteMaintenance }) => {
          await deleteMaintenance(maintenance.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'tool',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            multiple: true,
            options: Object.values(MAINTENANCE_STATUS).map((status) => ({
              label: STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione os status',
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
            key: 'itemIds',
            label: 'Itens',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os itens',
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
            key: 'scheduledFor',
            label: 'Agendado Para',
            type: 'date-range',
          },
          {
            key: 'startedAt',
            label: 'Data de Início',
            type: 'date-range',
          },
          {
            key: 'finishedAt',
            label: 'Data de Conclusão',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar manutenções...',
    debounce: 300,
  },

  export: {
    title: 'Manutenções',
    filename: 'manutencoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'item', label: 'Item', path: 'item.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'scheduledFor', label: 'Agendado Para', path: 'scheduledFor', format: 'date' },
      { key: 'startedAt', label: 'Iniciado', path: 'startedAt', format: 'datetime' },
      { key: 'finishedAt', label: 'Finalizado', path: 'finishedAt', format: 'datetime' },
      { key: 'timeTaken', label: 'Tempo (min)', path: 'timeTaken' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Manutenção',
      route: '/estoque/manutencao/cadastrar',
      canCreate: canEditMaintenance,
    },
    bulk: [
      {
        key: 'start',
        label: 'Iniciar',
        icon: 'play',
        variant: 'default',
        confirm: {
          title: 'Confirmar Início',
          message: (count) => `Iniciar ${count} ${count === 1 ? 'manutenção' : 'manutenções'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'IN_PROGRESS', startedAt: new Date() })
        },
      },
      {
        key: 'complete',
        label: 'Concluir',
        icon: 'check',
        variant: 'default',
        confirm: {
          title: 'Confirmar Conclusão',
          message: (count) => `Concluir ${count} ${count === 1 ? 'manutenção' : 'manutenções'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'COMPLETED', finishedAt: new Date() })
        },
      },
      {
        key: 'cancel',
        label: 'Cancelar',
        icon: 'x',
        variant: 'secondary',
        confirm: {
          title: 'Confirmar Cancelamento',
          message: (count) => `Cancelar ${count} ${count === 1 ? 'manutenção' : 'manutenções'}?`,
        },
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'CANCELLED' })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'manutenção' : 'manutenções'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
