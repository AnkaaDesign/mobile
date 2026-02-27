import type { ListConfig } from '@/components/list/types'
import { canEditUsers } from '@/utils/permissions/entity-permissions'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  ACTIVE: 'Ativa',
  EXPIRED: 'Expirada',
  ARCHIVED: 'Arquivada',
}

export const messagesListConfig: ListConfig<any> = {
  key: 'administration-messages',
  title: 'Mensagens',

  query: {
    hook: 'useAdminMessagesInfiniteMobile',
    mutationsHook: 'useMessageMutations',
    batchMutationsHook: 'useMessageBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },

  table: {
    columns: [
      {
        key: 'title',
        label: 'TÍTULO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (message) => message.title || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (message) => STATUS_LABELS[message.status] || message.status || '-',
        format: 'badge',
        badgeEntity: 'MESSAGE',
      },
      {
        key: 'targetCount',
        label: 'PÚBLICO-ALVO',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (message) => {
          if (!message.targetCount || message.targetCount === 0) return 'Todos';
          return `${message.targetCount} usuário(s)`;
        },
      },
      {
        key: 'createdBy',
        label: 'CRIADO POR',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (message) => message.createdBy?.name || '-',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (message) => message.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['title', 'status', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (message, router) => {
          router.push(`/administracao/mensagens/detalhes/${message.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        visible: (message) => message.status !== 'ARCHIVED',
        onPress: (message, router) => {
          router.push(`/administracao/mensagens/editar/${message.id}`)
        },
      },
      {
        key: 'archive',
        label: 'Arquivar',
        icon: 'archive',
        variant: 'default',
        visible: (message) => message.status === 'ACTIVE',
        onPress: async (message, _, mutations) => {
          await mutations?.archive?.(message.id)
        },
      },
      {
        key: 'activate',
        label: 'Ativar',
        icon: 'playerPlay',
        variant: 'default',
        visible: (message) => message.status === 'DRAFT' || message.status === 'ARCHIVED',
        onPress: async (message, _, mutations) => {
          await mutations?.activate?.(message.id)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (message) => `Deseja excluir a mensagem "${message.title}"?`,
        },
        onPress: async (message, _, mutations) => {
          await mutations?.delete?.(message.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Rascunho', value: 'DRAFT' },
          { label: 'Agendada', value: 'SCHEDULED' },
          { label: 'Ativa', value: 'ACTIVE' },
          { label: 'Expirada', value: 'EXPIRED' },
          { label: 'Arquivada', value: 'ARCHIVED' },
        ],
        placeholder: 'Selecione os status',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar mensagens...',
    debounce: 500,
  },

  actions: {
    create: {
      label: 'Criar Mensagem',
      route: '/administracao/mensagens/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'mensagem' : 'mensagens'}?`,
        },
        onPress: async (ids, mutations) => {
          await mutations?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
