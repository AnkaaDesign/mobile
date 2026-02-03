import type { ListConfig } from '@/components/list/types'
import type { Warning } from '@/types'
import { WARNING_SEVERITY, WARNING_CATEGORY } from '@/constants/enums'
import { WARNING_SEVERITY_LABELS, WARNING_CATEGORY_LABELS } from '@/constants/enum-labels'


export const myTeamWarningsListConfig: ListConfig<Warning> = {
  key: 'my-team-warnings',
  title: 'Advertências da Equipe',

  query: {
    hook: 'useTeamStaffWarningsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      collaborator: {
        include: {
          position: true,
          sector: true,
        },
      },
      supervisor: true,
      attachments: true,
    },
  },

  table: {
    columns: [
      {
        key: 'collaboratorName',
        label: 'COLABORADOR',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (warning) => warning.collaborator?.name || '-',
        style: { fontWeight: '500' },
      },
      {
        key: 'severity',
        label: 'SEVERIDADE',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (warning) => WARNING_SEVERITY_LABELS[warning.severity],
        format: 'badge',
      },
      {
        key: 'category',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (warning) => warning.category ? WARNING_CATEGORY_LABELS[warning.category] : '-',
        format: 'badge',
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (warning) => warning.reason || '-',
      },
      {
        key: 'followUpDate',
        label: 'ACOMPANHAMENTO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (warning) => warning.followUpDate,
        format: 'date',
      },
      {
        key: 'isActive',
        label: 'ATIVA',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (warning) => warning.isActive,
        format: 'boolean',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (warning) => warning.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['collaboratorName', 'severity', 'category'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'severities',
        label: 'Severidade',
        type: 'select',
        multiple: true,
        options: Object.values(WARNING_SEVERITY).map((severity) => ({
          label: WARNING_SEVERITY_LABELS[severity],
          value: severity,
        })),
        placeholder: 'Selecione as severidades',
      },
      {
        key: 'categories',
        label: 'Categoria',
        type: 'select',
        multiple: true,
        options: Object.values(WARNING_CATEGORY).map((category) => ({
          label: WARNING_CATEGORY_LABELS[category],
          value: category,
        })),
        placeholder: 'Selecione as categorias',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
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
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'isActive',
        label: 'Mostrar apenas ativas',
        type: 'toggle',
        placeholder: 'Mostrar apenas ativas',
      },
      {
        key: 'createdAt',
        label: 'Data da Advertência',
        type: 'date-range',
        placeholder: 'Data da Advertência',
      },
      {
        key: 'followUpDate',
        label: 'Data de Acompanhamento',
        type: 'date-range',
        placeholder: 'Data de Acompanhamento',
      },
    ],
  },

  search: {
    placeholder: 'Buscar advertências...',
    debounce: 500,
  },

  export: {
    title: 'Advertências da Equipe',
    filename: 'advertencias-equipe',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'collaborator', label: 'Colaborador', path: 'collaborator.name' },
      { key: 'severity', label: 'Severidade', path: 'severity', format: (value) => WARNING_SEVERITY_LABELS[value] || value },
      { key: 'category', label: 'Categoria', path: 'category', format: (value) => value ? WARNING_CATEGORY_LABELS[value] : '-' },
      { key: 'reason', label: 'Motivo', path: 'reason' },
      { key: 'followUpDate', label: 'Acompanhamento', path: 'followUpDate', format: 'date' },
      { key: 'isActive', label: 'Ativa', path: 'isActive', format: 'boolean' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'date' },
    ],
  },

  // No create/edit/delete for my-team - warnings are managed through HR
  actions: undefined,

  emptyState: {
    icon: 'alert-triangle',
    title: 'Nenhuma advertência registrada',
    description: 'As advertências da sua equipe aparecerão aqui',
  },
}
