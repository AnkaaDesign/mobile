import type { ListConfig } from '@/components/list/types'
import type { Warning } from '@/types'
import {
  WARNING_SEVERITY,
  WARNING_CATEGORY,
  WARNING_SEVERITY_LABELS,
  WARNING_CATEGORY_LABELS,
} from '@/constants'

export const personalWarningsListConfig: ListConfig<Warning> = {
  key: 'personal-warnings',
  title: 'Minhas Advertências',

  query: {
    hook: 'useMyWarningsInfiniteMobile',
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
        key: 'severity',
        label: 'SEVERIDADE',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (warning) => WARNING_SEVERITY_LABELS[warning.severity] || warning.severity,
        format: 'badge',
        component: 'severity-badge',
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
        style: { fontWeight: '500' },
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
        key: 'supervisor.name',
        label: 'SUPERVISOR',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (warning) => warning.supervisor?.name || '-',
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
        label: 'ATIVO',
        sortable: true,
        width: 0.8,
        align: 'center',
        render: (warning) => warning.isActive ? 'Sim' : 'Não',
        format: 'badge',
      },
      {
        key: 'createdAt',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (warning) => warning.createdAt || '-',
        format: 'date',
      },
      {
        key: 'attachmentsCount',
        label: 'ANEXOS',
        sortable: false,
        width: 0.8,
        align: 'center',
        render: (warning) => String(warning.attachments?.length || 0),
        format: 'badge',
      },
    ],
    defaultVisible: ['severity', 'category', 'reason'],
    rowHeight: 72,
    actions: [],
  },

  filters: {
    fields: [
      {
        key: 'severity',
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
        key: 'category',
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
        key: 'isActive',
        label: 'Apenas Ativas',
        type: 'toggle',
        placeholder: 'Apenas Ativas',
        description: 'Mostrar apenas advertências ativas',
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
    debounce: 300,
  },

  export: {
    title: 'Minhas Advertências',
    filename: 'minhas-advertencias',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'severity', label: 'Severidade', path: 'severity', format: (value) => WARNING_SEVERITY_LABELS[value] || value },
      { key: 'category', label: 'Categoria', path: 'category', format: (value) => value ? WARNING_CATEGORY_LABELS[value] : '-' },
      { key: 'reason', label: 'Motivo', path: 'reason' },
      { key: 'description', label: 'Descrição', path: 'description' },
      { key: 'supervisor', label: 'Supervisor', path: 'supervisor.name' },
      { key: 'followUpDate', label: 'Acompanhamento', path: 'followUpDate', format: 'date' },
      { key: 'isActive', label: 'Ativo', path: 'isActive', format: (value) => value ? 'Sim' : 'Não' },
      { key: 'createdAt', label: 'Data', path: 'createdAt', format: 'date' },
    ],
  },

  // No create/edit/delete for personal warnings - read-only view
  actions: undefined,

  emptyState: {
    icon: 'alert-circle',
    title: 'Nenhuma advertência encontrada',
    description: 'Parabéns! Você não possui advertências registradas',
  },
}
