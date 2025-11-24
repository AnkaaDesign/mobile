import type { ListConfig } from '@/components/list/types'
import type { Deployment } from '@/types'
import { DEPLOYMENT_STATUS, DEPLOYMENT_ENVIRONMENT } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  BUILDING: 'Construindo',
  TESTING: 'Testando',
  DEPLOYING: 'Implantando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
  ROLLED_BACK: 'Revertido',
  CANCELLED: 'Cancelado',
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  DEVELOPMENT: 'Desenvolvimento',
  STAGING: 'Homologação',
  PRODUCTION: 'Produção',
}

export const deploymentsListConfig: ListConfig<Deployment> = {
  key: 'administration-deployments',
  title: 'Implantações',

  query: {
    hook: 'useDeploymentsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 20,
    include: {
      user: true,
    },
  },

  table: {
    columns: [
      {
        key: 'environment',
        label: 'AMBIENTE',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (deployment) => deployment.environment,
        format: 'badge',
        style: { fontWeight: '500' },
      },
      {
        key: 'version',
        label: 'VERSÃO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (deployment) => deployment.version || 'N/A',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (deployment) => STATUS_LABELS[deployment.status] || deployment.status,
        format: 'badge',
      },
      {
        key: 'branch',
        label: 'BRANCH',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (deployment) => deployment.branch || '-',
      },
      {
        key: 'commitSha',
        label: 'COMMIT',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (deployment) => deployment.commitSha ? deployment.commitSha.substring(0, 7) : '-',
        style: { fontFamily: 'monospace' },
      },
      {
        key: 'deployedBy',
        label: 'IMPLANTADO POR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (deployment) => deployment.deployedBy || deployment.user?.name || '-',
      },
      {
        key: 'startedAt',
        label: 'INICIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (deployment) => deployment.startedAt,
        format: 'date',
      },
      {
        key: 'completedAt',
        label: 'CONCLUÍDO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (deployment) => deployment.completedAt,
        format: 'date',
      },
    ],
    defaultVisible: ['environment', 'status', 'startedAt'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'status',
        type: 'select',
        multiple: true,
        options: Object.values(DEPLOYMENT_STATUS).map((status) => ({
          label: STATUS_LABELS[status],
          value: status,
        })),
        placeholder: 'Status',
      },
      {
        key: 'environment',
        type: 'select',
        multiple: true,
        options: Object.values(DEPLOYMENT_ENVIRONMENT).map((env) => ({
          label: ENVIRONMENT_LABELS[env],
          value: env,
        })),
        placeholder: 'Ambiente',
      },
      {
        key: 'startedAt',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
      {
        key: 'completedAt',
        type: 'date-range',
        placeholder: 'Data de Conclusão',
      },
    ],
  },

  search: {
    placeholder: 'Buscar implantações...',
    debounce: 300,
  },

  export: {
    title: 'Implantações',
    filename: 'implantacoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'environment', label: 'Ambiente', path: 'environment', format: (value) => ENVIRONMENT_LABELS[value] || value },
      { key: 'version', label: 'Versão', path: 'version' },
      { key: 'status', label: 'Status', path: 'status', format: (value) => STATUS_LABELS[value] || value },
      { key: 'branch', label: 'Branch', path: 'branch' },
      { key: 'commitSha', label: 'Commit', path: 'commitSha' },
      { key: 'deployedBy', label: 'Implantado Por', path: 'deployedBy' },
      { key: 'startedAt', label: 'Iniciado Em', path: 'startedAt', format: 'date' },
      { key: 'completedAt', label: 'Concluído Em', path: 'completedAt', format: 'date' },
      { key: 'rolledBackAt', label: 'Revertido Em', path: 'rolledBackAt', format: 'date' },
    ],
  },

  actions: {
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'implantação' : 'implantações'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
