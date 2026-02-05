import type { ListConfig } from '@/components/list/types'
import type { Notification } from '@/types'
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_TYPE } from '@/constants/enums'
import { canEditUsers } from '@/utils/permissions/entity-permissions'

const IMPORTANCE_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

const TYPE_LABELS: Record<string, string> = {
  SYSTEM: 'Sistema',
  PRODUCTION: 'Produção',
  STOCK: 'Estoque',
  USER: 'Usuário',
  GENERAL: 'Geral',
}

export const notificationsListConfig: ListConfig<Notification> = {
  key: 'administration-notifications',
  title: 'Notificações',

  query: {
    hook: 'useNotificationsInfiniteMobile',
    defaultSort: { field: 'sentAt', direction: 'desc' },
    pageSize: 25,
    include: {
      seenBy: true,
      _count: {
        select: {
          seenBy: true,
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'title',
        label: 'TÍTULO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (notification) => notification.title,
        style: { fontWeight: '500' },
      },
      {
        key: 'importance',
        label: 'IMPORTÂNCIA',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (notification) => IMPORTANCE_LABELS[notification.importance] || notification.importance,
        format: 'badge',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (notification) => notification.type ? TYPE_LABELS[notification.type] : '-',
        format: 'badge',
      },
      {
        key: 'message',
        label: 'MENSAGEM',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (notification) => notification.body || '-',
      },
      {
        key: 'seenCount',
        label: 'VISUALIZAÇÕES',
        sortable: false,
        width: 1.0,
        align: 'center',
        render: (notification) => String((notification as any)._count?.seenBy || 0),
        format: 'badge',
      },
      {
        key: 'sentAt',
        label: 'ENVIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (notification) => notification.sentAt || '-',
        format: 'datetime',
      },
      {
        key: 'createdAt',
        label: 'CADASTRADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (notification) => notification.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['title', 'type', 'sentAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (notification, router) => {
          router.push(`/administracao/notificacoes/detalhes/${notification.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        visible: (notification) => !notification.sentAt,
        onPress: (notification, router) => {
          router.push(`/administracao/notificacoes/editar/${notification.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (notification) => `Deseja excluir a notificação "${notification.title}"?`,
        },
        onPress: async (notification, _, mutations) => {
          await mutations?.delete?.(notification.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'importance',
        label: 'Importância',
        type: 'select',
        multiple: true,
        options: Object.values(NOTIFICATION_IMPORTANCE).map((importance) => ({
          label: IMPORTANCE_LABELS[importance],
          value: importance,
        })),
        placeholder: 'Selecione as importâncias',
      },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        multiple: true,
        options: Object.values(NOTIFICATION_TYPE).map((type) => ({
          label: TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'sent',
        label: 'Enviadas',
        type: 'toggle',
        placeholder: 'Enviadas',
        description: 'Apenas notificações enviadas',
      },
      {
        key: 'hasSeen',
        label: 'Visualizadas',
        type: 'toggle',
        placeholder: 'Visualizadas',
        description: 'Apenas notificações visualizadas',
      },
      {
        key: 'sentAt',
        label: 'Data de Envio',
        type: 'date-range',
        placeholder: 'Data de Envio',
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
    placeholder: 'Buscar notificações...',
    debounce: 500,
  },

  export: {
    title: 'Notificações',
    filename: 'notificacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'title', label: 'Título', path: 'title' },
      { key: 'importance', label: 'Importância', path: 'importance', format: (value) => IMPORTANCE_LABELS[value] || value },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => TYPE_LABELS[value] || value },
      { key: 'message', label: 'Mensagem', path: 'message' },
      { key: 'seenCount', label: 'Visualizações', path: '_count.seenBy' },
      { key: 'sentAt', label: 'Enviado em', path: 'sentAt', format: 'datetime' },
      { key: 'createdAt', label: 'Cadastrado em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Notificação',
      route: '/administracao/notificacoes/cadastrar/enviar',
      canCreate: canEditUsers,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'notificação' : 'notificações'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
