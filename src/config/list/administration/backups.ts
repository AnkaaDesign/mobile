import type { ListConfig } from '@/components/list/types'
import type { BackupMetadata } from '@/api-client/backup'
import { canEditUsers } from '@/utils/permissions/entity-permissions'

// Status labels from the actual codebase
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  failed: 'Falhou',
}

// Type labels from the actual codebase
const TYPE_LABELS: Record<string, string> = {
  database: 'Banco de Dados',
  files: 'Arquivos',
  full: 'Completo',
}

// Priority labels from the actual codebase
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

export const backupsListConfig: ListConfig<BackupMetadata> = {
  key: 'administration-backups',
  title: 'Backups do Sistema',

  query: {
    hook: 'useBackups',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 20,
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'NOME',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (backup) => backup.name || `Backup ${new Date(backup.createdAt).toLocaleDateString()}`,
        style: { fontWeight: '600' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (backup) => TYPE_LABELS[backup.type] || backup.type,
        format: 'badge',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (backup) => STATUS_LABELS[backup.status] || backup.status,
        format: 'badge',
      },
      {
        key: 'size',
        label: 'TAMANHO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (backup) => {
          if (!backup.size) return '-'
          const k = 1024
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
          const i = Math.floor(Math.log(backup.size) / Math.log(k))
          return `${parseFloat((backup.size / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
        },
      },
      {
        key: 'priority',
        label: 'PRIORIDADE',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (backup) => backup.priority ? PRIORITY_LABELS[backup.priority] : '-',
        format: 'badge',
      },
      {
        key: 'encrypted',
        label: 'CRIPTOGRAFADO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (backup) => backup.encrypted ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'duration',
        label: 'DURAÇÃO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (backup) => {
          if (!backup.duration) return '-'
          const seconds = Math.round(backup.duration / 1000)
          if (seconds < 60) return `${seconds}s`
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          return `${minutes}m ${remainingSeconds}s`
        },
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (backup) => backup.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['name', 'status', 'createdAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: 'Deseja realmente excluir este backup? Esta ação não pode ser desfeita.',
        },
        onPress: async (backup, _router, { deleteAsync }) => {
          await deleteAsync({ id: backup.id })
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Pendente', value: 'pending' },
          { label: 'Em Progresso', value: 'in_progress' },
          { label: 'Concluído', value: 'completed' },
          { label: 'Falhou', value: 'failed' },
        ],
        placeholder: 'Status',
      },
      {
        key: 'type',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Banco de Dados', value: 'database' },
          { label: 'Arquivos', value: 'files' },
          { label: 'Completo', value: 'full' },
        ],
        placeholder: 'Tipo',
      },
      {
        key: 'priority',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Baixa', value: 'low' },
          { label: 'Média', value: 'medium' },
          { label: 'Alta', value: 'high' },
          { label: 'Crítica', value: 'critical' },
        ],
        placeholder: 'Prioridade',
      },
      {
        key: 'encrypted',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Sim', value: 'true' },
          { label: 'Não', value: 'false' },
        ],
        placeholder: 'Criptografado',
      },
    ],
  },

  search: {
    placeholder: 'Buscar backups...',
    debounce: 300,
  },

  export: {
    title: 'Backups',
    filename: 'backups-sistema',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'name', label: 'Nome', path: 'name' },
      {
        key: 'type',
        label: 'Tipo',
        path: 'type',
        format: (value) => TYPE_LABELS[value] || value
      },
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => STATUS_LABELS[value] || value
      },
      {
        key: 'size',
        label: 'Tamanho (bytes)',
        path: 'size'
      },
      {
        key: 'priority',
        label: 'Prioridade',
        path: 'priority',
        format: (value) => value ? PRIORITY_LABELS[value] : '-'
      },
      {
        key: 'encrypted',
        label: 'Criptografado',
        path: 'encrypted',
        format: (value) => value ? 'Sim' : 'Não'
      },
      { key: 'duration', label: 'Duração (ms)', path: 'duration' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'error', label: 'Erro', path: 'error' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Novo Backup',
      route: '/servidor/backups/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'backup' : 'backups'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
