import type { ListConfig } from '@/components/list/types'
import type { UserBenefit } from '@/types'
import { BENEFIT_KIND, BENEFIT_ENROLLMENT_STATUS } from '@/constants/enums'
import { BENEFIT_KIND_LABELS, BENEFIT_ENROLLMENT_STATUS_LABELS } from '@/constants/enum-labels'
import { formatCurrency } from '@/utils'
import { canEditHrEntities, canDeleteHrEntities } from '@/utils/permissions/entity-permissions'

export const userBenefitsListConfig: ListConfig<UserBenefit> = {
  key: 'hr-user-benefits',
  title: 'Benefícios',

  query: {
    hook: 'useUserBenefitsInfiniteMobile',
    mutationsHook: 'useUserBenefitMutations',
    batchMutationsHook: 'useUserBenefitBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: true,
      benefit: true,
    },
  },

  table: {
    columns: [
      {
        key: 'user.name',
        label: 'COLABORADOR',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (userBenefit) => userBenefit.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'benefit.name',
        label: 'BENEFÍCIO',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (userBenefit) => userBenefit.benefit?.name || '—',
      },
      {
        key: 'kind',
        label: 'TIPO',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (userBenefit) => userBenefit.benefit?.kind ? BENEFIT_KIND_LABELS[userBenefit.benefit.kind] : '—',
        format: 'badge',
        badge: () => ({ variant: 'secondary' }),
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (userBenefit) => userBenefit.status ? BENEFIT_ENROLLMENT_STATUS_LABELS[userBenefit.status] : '—',
        format: 'badge',
        badgeEntity: 'BENEFIT_ENROLLMENT',
      },
      {
        key: 'monthlyValue',
        label: 'VALOR MENSAL',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (userBenefit) => formatCurrency(userBenefit.monthlyValue),
      },
      {
        key: 'installments',
        label: 'PARCELAS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (userBenefit) =>
          userBenefit.totalInstallments != null
            ? `${userBenefit.currentInstallment ?? 1}/${userBenefit.totalInstallments}`
            : '—',
      },
      {
        key: 'startDate',
        label: 'INÍCIO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (userBenefit) => userBenefit.startDate,
        format: 'date',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (userBenefit) => userBenefit.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: ['user.name', 'benefit.name', 'status', 'monthlyValue'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (userBenefit, router) => {
          router.push(`/recursos-humanos/beneficios/detalhes/${userBenefit.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditHrEntities,
        onPress: (userBenefit, router) => {
          router.push(`/recursos-humanos/beneficios/editar/${userBenefit.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteHrEntities,
        confirm: {
          title: 'Confirmar Exclusão',
          message: () => `Deseja excluir esta adesão de benefício?`,
        },
        onPress: async (userBenefit, _, context) => {
          await context?.delete?.(userBenefit.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.entries(BENEFIT_ENROLLMENT_STATUS_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o status',
      },
      {
        key: 'kinds',
        label: 'Tipo de Benefício',
        type: 'select',
        multiple: true,
        options: Object.entries(BENEFIT_KIND_LABELS).map(([key, label]) => ({
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
        queryKey: ['users', 'filter', 'user-benefits'],
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
            console.error('[User Benefit Filter] Error:', error)
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
      {
        key: 'startDate',
        label: 'Data de Início',
        type: 'date-range',
        placeholder: 'Data de Início',
      },
    ],
  },

  search: {
    placeholder: 'Buscar adesões...',
    debounce: 500,
  },

  export: {
    title: 'Benefícios',
    filename: 'beneficios',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'benefit', label: 'Benefício', path: 'benefit.name' },
      { key: 'kind', label: 'Tipo', path: 'benefit.kind', format: (value: any): string => value ? BENEFIT_KIND_LABELS[value as BENEFIT_KIND] : '—' },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => value ? BENEFIT_ENROLLMENT_STATUS_LABELS[value as BENEFIT_ENROLLMENT_STATUS] : '—' },
      { key: 'monthlyValue', label: 'Valor Mensal', path: 'monthlyValue', format: 'currency' },
      { key: 'startDate', label: 'Início', path: 'startDate', format: 'date' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Adesão',
      route: '/recursos-humanos/beneficios/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'adesão' : 'adesões'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ userBenefitIds: Array.from(ids) })
        },
        canPerform: canDeleteHrEntities,
      },
    ],
  },
}
