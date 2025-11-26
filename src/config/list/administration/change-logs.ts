import type { ListConfig } from '@/components/list/types'
import type { ChangeLog } from '@/types'
import { CHANGE_LOG_ACTION, CHANGE_LOG_ENTITY_TYPE } from '@/constants/enums'

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar',
  DELETE: 'Excluir',
  RESTORE: 'Restaurar',
  ROLLBACK: 'Reverter',
  ARCHIVE: 'Arquivar',
  UNARCHIVE: 'Desarquivar',
  ACTIVATE: 'Ativar',
  DEACTIVATE: 'Desativar',
  APPROVE: 'Aprovar',
  REJECT: 'Rejeitar',
  CANCEL: 'Cancelar',
  COMPLETE: 'Concluir',
  RESCHEDULE: 'Reagendar',
  BATCH_CREATE: 'Criar em Lote',
  BATCH_UPDATE: 'Atualizar em Lote',
  BATCH_DELETE: 'Excluir em Lote',
  VIEW: 'Visualizar',
}

// Simplified entity labels (only most common ones, full list would be very long)
const ENTITY_TYPE_LABELS: Record<string, string> = {
  ACTIVITY: 'Atividade',
  AIRBRUSHING: 'Aerografia',
  BONUS: 'Bonificação',
  BORROW: 'Empréstimo',
  CATEGORY: 'Categoria',
  CUT: 'Corte',
  ITEM: 'Item',
  ITEM_BRAND: 'Marca de Item',
  ITEM_CATEGORY: 'Categoria de Item',
  MAINTENANCE: 'Manutenção',
  NOTIFICATION: 'Notificação',
  ORDER: 'Pedido',
  USER: 'Usuário',
  CUSTOMER: 'Cliente',
  SECTOR: 'Setor',
  POSITION: 'Cargo',
  VACATION: 'Férias',
  WARNING: 'Advertência',
  PPE_DELIVERY: 'Entrega EPI',
  PPE_SIZE: 'Tamanho EPI',
  TASK: 'Tarefa',
}

export const changeLogsListConfig: ListConfig<ChangeLog> = {
  key: 'administration-change-logs',
  title: 'Registros de Alterações',

  query: {
    hook: 'useChangeLogsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 50,
    include: {
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'action',
        label: 'AÇÃO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (log) => log.action,
        format: 'badge',
      },
      {
        key: 'entityType',
        label: 'ENTIDADE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (log) => ENTITY_TYPE_LABELS[log.entityType] || log.entityType,
      },
      {
        key: 'field',
        label: 'CAMPO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (log) => log.field || '-',
      },
      {
        key: 'oldValue',
        label: 'VALOR ANTERIOR',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (log) => {
          if (log.oldValue === null || log.oldValue === undefined) return '-'
          return typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : String(log.oldValue)
        },
      },
      {
        key: 'newValue',
        label: 'NOVO VALOR',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (log) => {
          if (log.newValue === null || log.newValue === undefined) return '-'
          return typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue)
        },
      },
      {
        key: 'user',
        label: 'USUÁRIO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (log) => log.user?.name || 'Sistema',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (log) => log.createdAt,
        format: 'datetime',
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (log) => log.reason || '-',
      },
    ],
    defaultVisible: ['action', 'user', 'createdAt'],
    rowHeight: 72,
    // No row actions - change logs are audit records meant to be viewed in list form only
    // The full information is already visible in the expandable row details
    actions: [],
    onRowPress: (log, router) => {
      router.push(`/(tabs)/servidor/registros-de-alteracoes/detalhes/${log.id}` as any)
    },
  },

  filters: {
    fields: [
      {
        key: 'actions',
        label: 'Ações',
        type: 'select',
        multiple: true,
        options: Object.values(CHANGE_LOG_ACTION).map((action) => ({
          label: ACTION_LABELS[action],
          value: action,
        })),
        placeholder: 'Selecione as ações',
      },
      {
        key: 'entityTypes',
        label: 'Entidades',
        type: 'select',
        multiple: true,
        options: Object.values(CHANGE_LOG_ENTITY_TYPE).map((type) => ({
          label: ENTITY_TYPE_LABELS[type] || type,
          value: type,
        })),
        placeholder: 'Selecione as entidades',
      },
      {
        key: 'userIds',
        label: 'Usuários',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          try {
            const { getUsers } = await import('@/api-client')
            const pageSize = 20
            const response = await getUsers({
              where: searchTerm ? { name: { contains: searchTerm, mode: 'insensitive' } } : undefined,
              orderBy: { name: 'asc' },
              limit: pageSize,
              page: page,
            })
            return {
              data: (response.data || []).map((user: any) => ({
                label: user.name,
                value: user.id,
              })),
              hasMore: response.meta?.hasNextPage ?? false,
              total: response.meta?.totalRecords,
            }
          } catch (error) {
            console.error('[User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os usuários',
      },
      {
        key: 'createdAt',
        label: 'Data da Alteração',
        type: 'date-range',
        placeholder: 'Data da Alteração',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por campo, motivo...',
    debounce: 300,
  },

  export: {
    title: 'Registros de Alterações',
    filename: 'registros-alteracoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'action', label: 'Ação', path: 'action', format: (value) => ACTION_LABELS[value] || value },
      { key: 'entityType', label: 'Entidade', path: 'entityType', format: (value) => ENTITY_TYPE_LABELS[value] || value },
      { key: 'entityId', label: 'ID Entidade', path: 'entityId' },
      { key: 'field', label: 'Campo', path: 'field' },
      { key: 'oldValue', label: 'Valor Anterior', path: 'oldValue' },
      { key: 'newValue', label: 'Novo Valor', path: 'newValue' },
      { key: 'user', label: 'Usuário', path: 'user.name' },
      { key: 'reason', label: 'Motivo', path: 'reason' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'datetime' },
    ],
  },

  // No create/edit/delete actions - this is an audit log (read-only)
  actions: undefined,
}
