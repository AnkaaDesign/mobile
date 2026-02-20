import React from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useBackupSystemHealth } from '@/hooks/useBackup'
import { borderRadius } from '@/constants/design-system'
import type { ListConfig } from '@/components/list/types'
import type { BackupMetadata } from '@/api-client/backup'
import { canEditUsers } from '@/utils/permissions/entity-permissions'

// Status labels
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  failed: 'Falhou',
}

// Type labels
const TYPE_LABELS: Record<string, string> = {
  database: 'Banco de Dados',
  files: 'Arquivos',
  system: 'Sistema',
  full: 'Completo',
}

// Priority labels
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

/** Stats cards header component — uses useBackupSystemHealth hook */
function BackupStatsHeader({ colors }: { colors: any }) {
  const { data: health, isLoading } = useBackupSystemHealth()

  if (isLoading || !health) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ width: '31.5%' }}>
            <Skeleton height={64} width="100%" borderRadius={borderRadius.md} />
          </View>
        ))}
      </View>
    )
  }

  const stats = [
    { label: 'Total', value: health.totalBackups, icon: 'database', color: '#3b82f6' },
    { label: 'Concluídos', value: health.completedBackups, icon: 'circle-check', color: '#22c55e' },
    { label: 'Progresso', value: health.inProgressBackups, icon: 'activity', color: '#f59e0b' },
    { label: 'Falhos', value: health.failedBackups, icon: 'x-circle', color: '#ef4444' },
    { label: 'Agendados', value: health.scheduledBackups, icon: 'clock', color: '#14b8a6' },
    { label: 'Tamanho', value: health.totalSize || '0 B', icon: 'hard-drive', color: '#8b5cf6' },
  ]

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 }}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={{
            width: '31.5%',
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            padding: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Icon name={stat.icon} size={13} color={stat.color} />
            <Text style={{ fontSize: 10, color: colors.mutedForeground }} numberOfLines={1}>{stat.label}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{stat.value}</Text>
        </View>
      ))}
    </View>
  )
}

export const backupsListConfig: ListConfig<BackupMetadata> = {
  key: 'administration-backups',
  title: 'Backups do Sistema',

  header: (colors) => <BackupStatsHeader colors={colors} />,

  query: {
    hook: 'useBackupsInfiniteMobile',
    mutationsHook: 'useBackupMutations',
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
        badgeEntity: 'BACKUP',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (backup) => STATUS_LABELS[backup.status] || backup.status,
        format: 'badge',
        badgeEntity: 'BACKUP',
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
        badgeEntity: 'BACKUP',
      },
      {
        key: 'encrypted',
        label: 'CRIPTOGRAFADO',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (backup) => backup.encrypted ? 'Sim' : 'Não',
        format: 'badge',
        badgeEntity: 'BACKUP',
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
        key: 'view',
        label: 'Ver Detalhes',
        icon: 'eye',
        route: (backup) => `/servidor/backups/detalhes/${backup.id}`,
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: 'Deseja realmente excluir este backup? Esta ação não pode ser desfeita.',
        },
        onPress: async (backup, _, context) => {
          const del = context?.delete
          if (typeof del === 'function') {
            await del(backup.id)
          } else if ((del as any)?.mutateAsync) {
            await (del as any).mutateAsync(backup.id)
          }
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
          { label: 'Pendente', value: 'pending' },
          { label: 'Em Progresso', value: 'in_progress' },
          { label: 'Concluído', value: 'completed' },
          { label: 'Falhou', value: 'failed' },
        ],
        placeholder: 'Selecione os status',
      },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Banco de Dados', value: 'database' },
          { label: 'Arquivos', value: 'files' },
          { label: 'Sistema', value: 'system' },
          { label: 'Completo', value: 'full' },
        ],
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'priority',
        label: 'Prioridade',
        type: 'select',
        multiple: true,
        options: [
          { label: 'Baixa', value: 'low' },
          { label: 'Média', value: 'medium' },
          { label: 'Alta', value: 'high' },
          { label: 'Crítica', value: 'critical' },
        ],
        placeholder: 'Selecione as prioridades',
      },
      {
        key: 'encrypted',
        label: 'Criptografado',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Sim', value: 'true' },
          { label: 'Não', value: 'false' },
        ],
        placeholder: 'Selecione',
      },
    ],
  },

  search: {
    placeholder: 'Buscar backups...',
    debounce: 500,
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
        format: (value) => TYPE_LABELS[value] || value,
      },
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => STATUS_LABELS[value] || value,
      },
      { key: 'size', label: 'Tamanho (bytes)', path: 'size' },
      {
        key: 'priority',
        label: 'Prioridade',
        path: 'priority',
        format: (value) => (value ? PRIORITY_LABELS[value] : '-'),
      },
      {
        key: 'encrypted',
        label: 'Criptografado',
        path: 'encrypted',
        format: (value) => (value ? 'Sim' : 'Não'),
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
          message: (count: number) => `Deseja excluir ${count} ${count === 1 ? 'backup' : 'backups'}?`,
        },
        onPress: async (ids, context) => {
          await context?.batchDeleteAsync?.({ ids: Array.from(ids) })
        },
      },
    ],
  },

  emptyState: {
    icon: 'database',
    title: 'Nenhum backup encontrado',
    description: 'Crie seu primeiro backup para proteger seus dados',
  },
}
