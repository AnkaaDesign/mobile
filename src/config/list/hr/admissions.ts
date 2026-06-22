import type { ListConfig } from '@/components/list/types'
import type { Admission } from '@/types'
import { ADMISSION_STATUS, MEDICAL_EXAM_RESULT } from '@/constants/enums'
import {
  ADMISSION_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  MEDICAL_EXAM_RESULT_LABELS,
  MEDICAL_EXAM_STATUS_LABELS,
} from '@/constants/enum-labels'
import { getBadgeVariantFromStatus } from '@/components/ui/badge'
import { getDocumentProgress } from '@/components/personnel-department/admission/utils'
import { canEditHrEntities, canDeleteDpRecords } from '@/utils/permissions/entity-permissions'

// Non-final statuses = "em andamento". By default the list shows only these
// (Concluída/Cancelada stay hidden until the user explicitly filters them in).
// Mirrors web AdmissionList ACTIVE_ADMISSION_STATUSES.
const ACTIVE_ADMISSION_STATUSES: ADMISSION_STATUS[] = [
  ADMISSION_STATUS.DOCS_PENDING,
  ADMISSION_STATUS.MEDICAL_EXAM,
  ADMISSION_STATUS.CONTRACT,
  ADMISSION_STATUS.REGISTRATION,
]

export const admissionsListConfig: ListConfig<Admission> = {
  key: 'hr-admissions',
  title: 'Admissões',

  query: {
    hook: 'useAdmissionsInfiniteMobile',
    mutationsHook: 'useAdmissionMutations',
    batchMutationsHook: 'useAdmissionBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: { include: { position: true, sector: true } },
      createdBy: true,
      documents: true,
      admissionExam: true,
    },
  },

  table: {
    columns: [
      {
        key: 'user.name',
        label: 'COLABORADOR',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (admission) => admission.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'user.sector',
        label: 'SETOR',
        sortable: false,
        width: 1.4,
        align: 'left',
        render: (admission) => admission.user?.sector?.name || '—',
      },
      {
        key: 'user.position',
        label: 'CARGO',
        sortable: false,
        width: 1.4,
        align: 'left',
        render: (admission) => admission.user?.position?.name || '—',
      },
      {
        key: 'user.currentContractType',
        label: 'TIPO DE CONTRATO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (admission) =>
          admission.user?.currentContractType
            ? CONTRACT_TYPE_LABELS[admission.user.currentContractType] || admission.user.currentContractType
            : '',
        format: 'badge',
        badge: (admission) =>
          admission.user?.currentContractType
            ? { variant: getBadgeVariantFromStatus(admission.user.currentContractType, 'USER') }
            : { variant: 'secondary' },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (admission) => admission.status ? ADMISSION_STATUS_LABELS[admission.status] : '—',
        format: 'badge',
        badge: (admission) => ({ variant: getBadgeVariantFromStatus(admission.status, 'ADMISSION') }),
      },
      {
        key: 'hireDate',
        label: 'DATA DE ADMISSÃO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (admission) => admission.hireDate,
        format: 'date',
      },
      {
        key: 'admissionExam',
        label: 'EXAME',
        sortable: false,
        width: 1.1,
        align: 'left',
        render: (admission) => {
          const exam = admission.admissionExam
          if (!exam) return ''
          const hasResult = !!exam.result && exam.result !== MEDICAL_EXAM_RESULT.PENDING
          return hasResult
            ? MEDICAL_EXAM_RESULT_LABELS[exam.result] || exam.result
            : MEDICAL_EXAM_STATUS_LABELS[exam.status] || exam.status
        },
        format: 'badge',
        badge: (admission) => {
          const exam = admission.admissionExam
          if (!exam) return { variant: 'secondary' }
          const hasResult = !!exam.result && exam.result !== MEDICAL_EXAM_RESULT.PENDING
          return hasResult
            ? { variant: getBadgeVariantFromStatus(exam.result, 'MEDICAL_EXAM_RESULT') }
            : { variant: getBadgeVariantFromStatus(exam.status, 'MEDICAL_EXAM') }
        },
      },
      {
        key: 'documents',
        label: 'DOCUMENTOS',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (admission) => {
          const { done, total } = getDocumentProgress(admission.documents)
          return total === 0 ? '—' : `${done}/${total}`
        },
      },
      {
        key: 'createdBy.name',
        label: 'CRIADO POR',
        sortable: false,
        width: 1.4,
        align: 'left',
        render: (admission) => admission.createdBy?.name || '—',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (admission) => admission.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: [
      'user.name',
      'user.sector',
      'user.position',
      'user.currentContractType',
      'status',
      'hireDate',
      'admissionExam',
      'documents',
      'createdBy.name',
    ],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (admission, router) => {
          router.push(`/recursos-humanos/admissoes/detalhes/${admission.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditHrEntities,
        onPress: (admission, router) => {
          router.push(`/recursos-humanos/admissoes/editar/${admission.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteDpRecords,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir esta admissão? Apenas admissões canceladas ou concluídas podem ser excluídas — cancele a admissão em andamento antes de excluí-la.`,
        },
        onPress: async (admission, _, context) => {
          await context?.delete?.(admission.id)
        },
      },
    ],
  },

  filters: {
    // Default bucket = active-only (em andamento). Renders as removable status
    // chips; removing them all reveals Concluída/Cancelada. Mirrors web.
    defaultValues: {
      statuses: ACTIVE_ADMISSION_STATUSES,
    },
    fields: [
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.entries(ADMISSION_STATUS_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o status',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'admissions'],
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
            console.error('[Admission User Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por colaborador ou observação',
    debounce: 500,
  },

  export: {
    title: 'Admissões',
    filename: 'admissoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => value ? ADMISSION_STATUS_LABELS[value as ADMISSION_STATUS] : '—' },
      { key: 'hireDate', label: 'Admissão', path: 'hireDate', format: 'date' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Admissão',
      route: '/recursos-humanos/admissoes/cadastrar',
      canCreate: canEditHrEntities,
    },
    bulk: [
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'admissão' : 'admissões'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ admissionIds: Array.from(ids) })
        },
        canPerform: canDeleteDpRecords,
      },
    ],
  },
}
