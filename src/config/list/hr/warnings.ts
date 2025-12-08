import type { ListConfig } from '@/components/list/types'
import type { Warning } from '@/types'
import { WARNING_SEVERITY, WARNING_CATEGORY } from '@/constants/enums'
import { WARNING_SEVERITY_LABELS, WARNING_CATEGORY_LABELS } from '@/constants/enum-labels'

export const warningsListConfig: ListConfig<Warning> = {
  key: 'hr-warnings',
  title: 'Advertências',

  query: {
    hook: 'useWarningsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      collaborator: true,
      attachments: true,
    },
  },

  table: {
    columns: [
      {
        key: 'collaborator.name',
        label: 'FUNCIONÁRIO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (warning) => warning.collaborator?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'category',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (warning) => warning.category ? WARNING_CATEGORY_LABELS[warning.category] : '—',
        format: 'badge',
        badgeVariant: 'primary',
      },
      {
        key: 'severity',
        label: 'SEVERIDADE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (warning) => warning.severity ? WARNING_SEVERITY_LABELS[warning.severity] : '—',
        format: 'badge',
        badgeVariant: 'secondary',
      },
      {
        key: 'followUpDate',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (warning) => warning.followUpDate,
        format: 'date',
      },
      {
        key: 'attachments',
        label: 'ANEXO',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (warning) => warning.attachments && warning.attachments.length > 0 ? '📎' : '—',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (warning) => warning.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['collaborator.name', 'category', 'followUpDate'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (warning, router) => {
          router.push(`/recursos-humanos/advertencias/detalhes/${warning.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        onPress: (warning, router) => {
          router.push(`/recursos-humanos/advertencias/editar/${warning.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (warning) => `Deseja excluir esta advertência?`,
        },
        onPress: async (warning, _, { delete: deleteWarning }) => {
          await deleteWarning(warning.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'severity',
        label: 'Severidade',
        type: 'select',
        multiple: false,
        options: Object.entries(WARNING_SEVERITY_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione a severidade',
      },
      {
        key: 'category',
        label: 'Categoria',
        type: 'select',
        multiple: false,
        options: Object.entries(WARNING_CATEGORY_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione a categoria',
      },
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ativas', value: 'active' },
          { label: 'Resolvidas', value: 'resolved' },
        ],
        placeholder: 'Selecione o status',
      },
      {
        key: 'collaboratorIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'collaborators'],
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
            console.error('[Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'supervisorIds',
        label: 'Supervisores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'supervisors'],
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
            console.error('[Supervisor Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os supervisores',
      },
      {
        key: 'witnessIds',
        label: 'Testemunhas',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'witnesses'],
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
            console.error('[Witness Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione as testemunhas',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
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
    debounce: 300,
  },

  export: {
    title: 'Advertências',
    filename: 'advertencias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'collaborator', label: 'Funcionário', path: 'collaborator.name' },
      { key: 'category', label: 'Categoria', path: 'category', format: (value) => value ? WARNING_CATEGORY_LABELS[value] : '—' },
      { key: 'severity', label: 'Severidade', path: 'severity', format: (value) => WARNING_SEVERITY_LABELS[value] || value },
      { key: 'followUpDate', label: 'Data', path: 'followUpDate', format: 'date' },
      { key: 'attachments', label: 'Anexo', path: 'attachments', format: (value) => value && value.length > 0 ? 'Sim' : 'Não' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Advertência',
      route: '/recursos-humanos/advertencias/cadastrar',
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'advertência' : 'advertências'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
