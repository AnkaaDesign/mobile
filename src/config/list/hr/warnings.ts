import type { ListConfig } from '@/components/list/types'
import type { Warning } from '@/types'
import { WARNING_SEVERITY, WARNING_CATEGORY } from '@/constants/enums'

const SEVERITY_LABELS: Record<string, string> = {
  VERBAL: 'Verbal',
  WRITTEN: 'Escrita',
  SUSPENSION: 'Suspensão',
  FINAL_WARNING: 'Advertência Final',
}

const CATEGORY_LABELS: Record<string, string> = {
  SAFETY: 'Segurança',
  MISCONDUCT: 'Má Conduta',
  INSUBORDINATION: 'Insubordinação',
  POLICY_VIOLATION: 'Violação de Política',
  ATTENDANCE: 'Assiduidade',
  PERFORMANCE: 'Desempenho',
  BEHAVIOR: 'Comportamento',
  OTHER: 'Outro',
}

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
        render: (warning) => warning.severity,
        format: 'badge',
      },
      {
        key: 'category',
        label: 'CATEGORIA',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (warning) => warning.category ? CATEGORY_LABELS[warning.category] : '-',
        format: 'badge',
      },
      {
        key: 'description',
        label: 'DESCRIÇÃO',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (warning) => warning.description || '-',
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
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (warning) => warning.createdAt,
        format: 'date',
      },
      {
        key: 'attachmentsCount',
        label: 'ANEXOS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (warning) => warning.attachments?.length || 0,
        format: 'badge',
      },
    ],
    defaultVisible: ['collaborator.name', 'severity', 'createdAt'],
    rowHeight: 60,
    actions: [
      {
        key: 'view',
        label: 'Ver',
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
    sections: [
      {
        key: 'severity',
        label: 'Severidade',
        icon: 'alert-triangle',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'severities',
            label: 'Severidade',
            type: 'select',
            multiple: true,
            options: Object.values(WARNING_SEVERITY).map((severity) => ({
              label: SEVERITY_LABELS[severity],
              value: severity,
            })),
            placeholder: 'Selecione as severidades',
          },
        ],
      },
      {
        key: 'category',
        label: 'Categoria',
        icon: 'tag',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'categories',
            label: 'Categoria',
            type: 'select',
            multiple: true,
            options: Object.values(WARNING_CATEGORY).map((category) => ({
              label: CATEGORY_LABELS[category],
              value: category,
            })),
            placeholder: 'Selecione as categorias',
          },
        ],
      },
      {
        key: 'collaborator',
        label: 'Colaborador',
        icon: 'user',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'collaboratorIds',
            label: 'Colaboradores',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              return []
            },
            placeholder: 'Selecione os colaboradores',
          },
        ],
      },
      {
        key: 'dates',
        label: 'Datas',
        icon: 'calendar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'createdAt',
            label: 'Data da Advertência',
            type: 'date-range',
          },
          {
            key: 'followUpDate',
            label: 'Data de Acompanhamento',
            type: 'date-range',
          },
        ],
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
      { key: 'collaborator', label: 'Colaborador', path: 'collaborator.name' },
      { key: 'severity', label: 'Severidade', path: 'severity', format: (value) => SEVERITY_LABELS[value] || value },
      { key: 'category', label: 'Categoria', path: 'category', format: (value) => value ? CATEGORY_LABELS[value] : '-' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'followUpDate', label: 'Acompanhamento', path: 'followUpDate', format: 'date' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'date' },
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
