import type { ListConfig } from '@/components/list/types'
import type { MedicalExam } from '@/types'
import { MEDICAL_EXAM_TYPE, MEDICAL_EXAM_STATUS, MEDICAL_EXAM_RESULT } from '@/constants/enums'
import {
  MEDICAL_EXAM_TYPE_LABELS,
  MEDICAL_EXAM_STATUS_LABELS,
  MEDICAL_EXAM_RESULT_LABELS,
} from '@/constants/enum-labels'
import {
  canEditOccupationalHealth,
  canDeleteOccupationalHealth,
} from '@/utils/permissions/entity-permissions'

/** Dias até (ou desde) a validade do ASO. Negativo = vencido. */
function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  const target = new Date(date)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const ms = target.getTime() - now.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

/**
 * Texto "a vencer"/"vencido" para o ASO. Só relevante para exames realizados
 * (COMPLETED) com validade dentro de 60 dias (ou já vencidos).
 */
function expiryLabel(exam: MedicalExam): string {
  if (!exam.expiresAt) return '—'
  const days = daysUntil(exam.expiresAt)
  if (days === null) return '—'
  if (exam.status === MEDICAL_EXAM_STATUS.COMPLETED) {
    if (days < 0) return `Vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`
    if (days <= 60) return `Vence em ${days} dia${days !== 1 ? 's' : ''}`
  }
  return new Date(exam.expiresAt).toLocaleDateString('pt-BR')
}

export const medicalExamsListConfig: ListConfig<MedicalExam> = {
  key: 'hr-medical-exams',
  title: 'Exames Ocupacionais (ASO)',

  query: {
    hook: 'useMedicalExamsInfiniteMobile',
    mutationsHook: 'useMedicalExamMutations',
    batchMutationsHook: 'useMedicalExamBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
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
        render: (exam) => exam.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (exam) => (exam.type ? MEDICAL_EXAM_TYPE_LABELS[exam.type] : '—'),
        format: 'badge',
        badge: () => ({ variant: 'primary' }),
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (exam) => (exam.status ? MEDICAL_EXAM_STATUS_LABELS[exam.status] : '—'),
        format: 'badge',
        badge: (exam) => {
          switch (exam.status) {
            case MEDICAL_EXAM_STATUS.COMPLETED:
              return { variant: 'success' }
            case MEDICAL_EXAM_STATUS.EXPIRED:
              return { variant: 'destructive' }
            case MEDICAL_EXAM_STATUS.CANCELLED:
              return { variant: 'secondary' }
            default:
              return { variant: 'warning' }
          }
        },
      },
      {
        key: 'result',
        label: 'RESULTADO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (exam) => (exam.result ? MEDICAL_EXAM_RESULT_LABELS[exam.result] : '—'),
        format: 'badge',
        badge: (exam) => {
          switch (exam.result) {
            case MEDICAL_EXAM_RESULT.FIT:
              return { variant: 'success' }
            case MEDICAL_EXAM_RESULT.UNFIT:
              return { variant: 'destructive' }
            case MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS:
              return { variant: 'warning' }
            default:
              return { variant: 'secondary' }
          }
        },
      },
      {
        key: 'examDate',
        label: 'DATA',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (exam) => exam.examDate,
        format: 'date',
      },
      {
        key: 'expiresAt',
        label: 'VALIDADE',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (exam) => expiryLabel(exam),
        format: 'badge',
        badge: (exam) => {
          const days = daysUntil(exam.expiresAt)
          if (exam.status === MEDICAL_EXAM_STATUS.COMPLETED && days !== null) {
            if (days < 0) return { variant: 'destructive' }
            if (days <= 60) return { variant: 'warning' }
          }
          return { variant: 'secondary' }
        },
      },
    ],
    defaultVisible: ['user.name', 'type', 'status', 'expiresAt'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (exam, router) => {
          router.push(`/departamento-pessoal/medicina/aso/detalhes/${exam.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditOccupationalHealth,
        onPress: (exam, router) => {
          router.push(`/departamento-pessoal/medicina/aso/editar/${exam.id}`)
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
          message: () => `Deseja excluir este exame ocupacional?`,
        },
        onPress: async (exam, _, context) => {
          await context?.delete?.(exam.id)
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
        options: Object.entries(MEDICAL_EXAM_TYPE_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione os tipos',
      },
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.entries(MEDICAL_EXAM_STATUS_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione os status',
      },
      {
        key: 'results',
        label: 'Resultado',
        type: 'select',
        multiple: true,
        options: Object.entries(MEDICAL_EXAM_RESULT_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione os resultados',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'medical-exam-collaborators'],
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
            console.error('[Medical Exam Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'examDate',
        label: 'Data do Exame',
        type: 'date-range',
        placeholder: 'Data do Exame',
      },
      {
        key: 'expiresAt',
        label: 'Validade',
        type: 'date-range',
        placeholder: 'Validade',
      },
    ],
  },

  search: {
    placeholder: 'Buscar exames...',
    debounce: 500,
  },

  export: {
    title: 'Exames Ocupacionais (ASO)',
    filename: 'exames-ocupacionais',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Funcionário', path: 'user.name' },
      { key: 'type', label: 'Tipo', path: 'type', format: (value: any): string => (value ? MEDICAL_EXAM_TYPE_LABELS[value as MEDICAL_EXAM_TYPE] : '—') },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => (value ? MEDICAL_EXAM_STATUS_LABELS[value as MEDICAL_EXAM_STATUS] : '—') },
      { key: 'result', label: 'Resultado', path: 'result', format: (value: any): string => (value ? MEDICAL_EXAM_RESULT_LABELS[value as MEDICAL_EXAM_RESULT] : '—') },
      { key: 'examDate', label: 'Data', path: 'examDate', format: 'date' },
      { key: 'expiresAt', label: 'Validade', path: 'expiresAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Exame',
      route: '/departamento-pessoal/medicina/aso/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'exame' : 'exames'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ medicalExamIds: Array.from(ids) })
        },
        canPerform: canDeleteOccupationalHealth,
      },
    ],
  },
}
