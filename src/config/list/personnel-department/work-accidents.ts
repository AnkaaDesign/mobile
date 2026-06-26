import type { ListConfig } from '@/components/list/types'
import type { WorkAccidentReport } from '@/types'
import { WORK_ACCIDENT_REPORT_TYPE_LABELS } from '@/constants/enum-labels'
import { canEditOccupationalHealth, canDeleteOccupationalHealth } from '@/utils/permissions/entity-permissions'

export const workAccidentsListConfig: ListConfig<WorkAccidentReport> = {
  key: 'hr-work-accidents',
  title: 'CAT — Acidentes de Trabalho',

  query: {
    hook: 'useWorkAccidentReportsInfiniteMobile',
    mutationsHook: 'useWorkAccidentReportMutations',
    batchMutationsHook: 'useWorkAccidentReportBatchMutations',
    defaultSort: { field: 'accidentDate', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
      leave: true,
      file: true,
    },
  },

  table: {
    columns: [
      {
        key: 'user.name',
        label: 'FUNCIONÁRIO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (report) => report.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'catNumber',
        label: 'Nº CAT',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (report) => report.catNumber || '—',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (report) => report.type ? WORK_ACCIDENT_REPORT_TYPE_LABELS[report.type] : '—',
        format: 'badge',
        badge: () => ({ variant: 'secondary' }),
      },
      {
        key: 'accidentDate',
        label: 'ACIDENTE',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (report) => report.accidentDate,
        format: 'date',
      },
      {
        key: 'emissionDate',
        label: 'EMISSÃO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (report) => report.emissionDate,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'catNumber', 'type', 'accidentDate'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (report, router) => {
          router.push(`/departamento-pessoal/medicina/cat/detalhes/${report.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditOccupationalHealth,
        onPress: (report, router) => {
          router.push(`/departamento-pessoal/medicina/cat/editar/${report.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteOccupationalHealth,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir esta CAT?`,
        },
        onPress: async (report, _, context) => {
          await context?.delete?.(report.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'types',
        label: 'Tipo',
        type: 'select',
        multiple: true,
        options: Object.entries(WORK_ACCIDENT_REPORT_TYPE_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o tipo',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'work-accident-collaborators'],
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
            console.error('[Work Accident Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'accidentDate',
        label: 'Data do Acidente',
        type: 'date-range',
        placeholder: 'Data do Acidente',
      },
    ],
  },

  search: {
    placeholder: 'Buscar CATs...',
    debounce: 500,
  },

  export: {
    title: 'CAT — Acidentes de Trabalho',
    filename: 'cat-acidentes-de-trabalho',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'catNumber', label: 'Nº CAT', path: 'catNumber' },
      { key: 'type', label: 'Tipo', path: 'type', format: (value: any): string => value ? WORK_ACCIDENT_REPORT_TYPE_LABELS[value as keyof typeof WORK_ACCIDENT_REPORT_TYPE_LABELS] : '—' },
      { key: 'accidentDate', label: 'Acidente', path: 'accidentDate', format: 'date' },
      { key: 'emissionDate', label: 'Emissão', path: 'emissionDate', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar CAT',
      route: '/departamento-pessoal/medicina/cat/cadastrar',
      canCreate: canEditOccupationalHealth,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'CAT' : 'CATs'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ workAccidentReportIds: Array.from(ids) })
        },
        canPerform: canDeleteOccupationalHealth,
      },
    ],
  },
}
