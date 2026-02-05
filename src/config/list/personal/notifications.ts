import type { ListConfig } from '@/components/list/types'
import type { Notification } from '@/types'
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_IMPORTANCE,
} from '@/constants'

// Local labels with Record<string, string> for flexible indexing
const TYPE_LABELS: Record<string, string> = {
  [NOTIFICATION_TYPE.SYSTEM]: 'Sistema',
  [NOTIFICATION_TYPE.PRODUCTION]: 'Produção',
  [NOTIFICATION_TYPE.STOCK]: 'Estoque',
  [NOTIFICATION_TYPE.USER]: 'Usuário',
  [NOTIFICATION_TYPE.GENERAL]: 'Geral',
}

const IMPORTANCE_LABELS: Record<string, string> = {
  [NOTIFICATION_IMPORTANCE.LOW]: 'Baixa',
  [NOTIFICATION_IMPORTANCE.NORMAL]: 'Normal',
  [NOTIFICATION_IMPORTANCE.HIGH]: 'Alta',
  [NOTIFICATION_IMPORTANCE.URGENT]: 'Urgente',
}

export const personalNotificationsListConfig: ListConfig<Notification> = {
  key: 'personal-notifications',
  title: 'Minhas Notificações',

  query: {
    hook: 'useNotificationsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      seenBy: true,
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
        render: (notification) => notification.title || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'message',
        label: 'MENSAGEM',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (notification) => notification.message || '-',
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
        key: 'importance',
        label: 'IMPORTÂNCIA',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (notification) => notification.importance ? IMPORTANCE_LABELS[notification.importance] : '-',
        format: 'badge',
        component: 'importance-badge',
      },
      {
        key: 'isRead',
        label: 'LIDA',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (notification, context) => {
          const userId = context?.user?.id
          if (!userId) return 'Não'
          const isSeen = notification.seenBy?.some((s) => s.userId === userId)
          return isSeen ? 'Sim' : 'Não'
        },
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (notification) => notification.createdAt || '-',
        format: 'date',
      },
      {
        key: 'sentAt',
        label: 'ENVIADA EM',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (notification) => notification.sentAt,
        format: 'date',
      },
    ],
    defaultVisible: ['title', 'type', 'createdAt'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'types',
        label: 'Tipos',
        type: 'select',
        multiple: true,
        options: Object.values(NOTIFICATION_TYPE).map((type) => ({
          label: TYPE_LABELS[type],
          value: type,
        })),
        placeholder: 'Selecione os tipos',
      },
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
        key: 'unreadOnly',
        label: 'Apenas Não Lidas',
        type: 'toggle',
        placeholder: 'Apenas Não Lidas',
        description: 'Mostrar apenas notificações não lidas',
      },
      {
        key: 'dateRange',
        label: 'Período',
        type: 'date-range',
        placeholder: 'Período',
      },
    ],
  },

  search: {
    placeholder: 'Buscar notificações...',
    debounce: 500,
  },

  export: {
    title: 'Minhas Notificações',
    filename: 'minhas-notificacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'title', label: 'Título', path: 'title' },
      { key: 'message', label: 'Mensagem', path: 'message' },
      { key: 'type', label: 'Tipo', path: 'type', format: (value) => TYPE_LABELS[value] || '-' },
      { key: 'importance', label: 'Importância', path: 'importance', format: (value) => IMPORTANCE_LABELS[value] || '-' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'date' },
      { key: 'sentAt', label: 'Enviada Em', path: 'sentAt', format: 'date' },
    ],
  },

  // No create/edit/delete for personal notifications - read-only view
  actions: undefined,

  emptyState: {
    icon: 'bell',
    title: 'Nenhuma notificação encontrada',
    description: 'Você não possui notificações no momento',
  },
}
