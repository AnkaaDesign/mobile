import type { ListConfig } from '@/components/list/types'
import type { ServiceOrder } from '@/types'
import {
  SERVICE_ORDER_STATUS,
  SERVICE_ORDER_STATUS_LABELS,
} from '@/constants'

export const serviceOrdersListConfig: ListConfig<ServiceOrder> = {
  key: 'production-service-orders',
  title: 'Ordens de Serviço',

  query: {
    hook: 'useServiceOrdersInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 40,
    include: {
      task: {
        include: {
          customer: {
            select: {
              id: true,
              fantasyName: true,
              corporateName: true,
              cnpj: true,
              cpf: true,
            },
          },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: true,
        width: 2.5,
        align: 'left',
        render: (order) => order.description || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (order) => SERVICE_ORDER_STATUS_LABELS[order.status as SERVICE_ORDER_STATUS] || order.status,
        format: 'badge',
      },
      {
        key: 'task.customer.fantasyName',
        label: 'CLIENTE',
        sortable: true,
        width: 1.8,
        align: 'left',
        render: (order) => order.task?.customer?.fantasyName || order.task?.customer?.corporateName || '-',
      },
      {
        key: 'service.name',
        label: 'SERVIÇO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (order) => order.service?.name || '-',
      },
      {
        key: 'startedAt',
        label: 'INICIADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (order) => order.startedAt,
        format: 'datetime',
      },
      {
        key: 'finishedAt',
        label: 'FINALIZADO EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (order) => order.finishedAt,
        format: 'datetime',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (order) => order.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['description', 'status', 'task.customer.fantasyName', 'service.name'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        onPress: (order, router) => {
          router.push(`/producao/ordens-de-servico/detalhes/${order.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (order, router) => {
          router.push(`/producao/ordens-de-servico/editar/${order.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (order) => `Deseja excluir a ordem de serviço "${order.description || order.id}"?`,
        },
        onPress: async (order, _, { delete: deleteOrder }) => {
          await deleteOrder(order.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        icon: 'list-checks',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            multiple: true,
            options: Object.values(SERVICE_ORDER_STATUS).map((status) => ({
              label: SERVICE_ORDER_STATUS_LABELS[status],
              value: status,
            })),
            placeholder: 'Selecione os status',
          },
        ],
      },
      {
        key: 'entities',
        label: 'Tarefas e Clientes',
        icon: 'briefcase',
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
              // Load from API
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
            key: 'startedAt',
            label: 'Data de Início',
            type: 'date-range',
          },
          {
            key: 'finishedAt',
            label: 'Data de Conclusão',
            type: 'date-range',
          },
          {
            key: 'createdAt',
            label: 'Data de Criação',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar por cliente, veículo ou descrição...',
    debounce: 300,
  },

  export: {
    title: 'Ordens de Serviço',
    filename: 'ordens-de-servico',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'status', label: 'Status', path: 'status' },
      { key: 'customer', label: 'Cliente', path: 'task.customer.fantasyName' },
      { key: 'service', label: 'Serviço', path: 'service.name' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'datetime' },
      { key: 'finishedAt', label: 'Finalizado Em', path: 'finishedAt', format: 'datetime' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Ordem de Serviço',
      route: '/producao/ordens-de-servico/cadastrar',
    },
    bulk: [
      {
        key: 'update-status',
        label: 'Atualizar Status',
        icon: 'list-checks',
        variant: 'default',
        confirm: {
          title: 'Atualizar Status',
          message: (count) => `Deseja atualizar o status de ${count} ${count === 1 ? 'ordem' : 'ordens'} de serviço?`,
        },
        onPress: async (ids, { batchUpdateAsync }) => {
          // Implementation would need to prompt for new status
          await batchUpdateAsync({ ids: Array.from(ids), data: {} })
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'ordem' : 'ordens'} de serviço?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
