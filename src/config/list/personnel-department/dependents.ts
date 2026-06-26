import type { ListConfig } from '@/components/list/types'
import type { Dependent } from '@/types'
import { DEPENDENT_RELATIONSHIP } from '@/constants/enums'
import { DEPENDENT_RELATIONSHIP_LABELS } from '@/constants/enum-labels'
import { formatCPF, formatCurrency } from '@/utils'
import { canEditHrEntities, canDeleteHrEntities } from '@/utils/permissions/entity-permissions'

export const dependentsListConfig: ListConfig<Dependent> = {
  key: 'hr-dependents',
  title: 'Dependentes',

  query: {
    hook: 'useDependentsInfiniteMobile',
    mutationsHook: 'useDependentMutations',
    batchMutationsHook: 'useDependentBatchMutations',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {
      user: true,
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
        render: (dependent) => dependent.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'name',
        label: 'DEPENDENTE',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (dependent) => dependent.name || '—',
      },
      {
        key: 'relationship',
        label: 'PARENTESCO',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (dependent) => dependent.relationship ? DEPENDENT_RELATIONSHIP_LABELS[dependent.relationship] : '—',
        format: 'badge',
        badge: () => ({ variant: 'secondary' }),
      },
      {
        key: 'cpf',
        label: 'CPF',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (dependent) => dependent.cpf ? formatCPF(dependent.cpf) : '—',
      },
      {
        key: 'irrfDeduction',
        label: 'DED. IRRF',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (dependent) => dependent.irrfDeduction ? 'Sim' : 'Não',
      },
      {
        key: 'salarioFamilia',
        label: 'SALÁRIO-FAMÍLIA',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (dependent) => dependent.salarioFamilia ? 'Sim' : 'Não',
      },
      {
        key: 'healthPlanValue',
        label: 'PLANO',
        sortable: false,
        width: 1.2,
        align: 'right',
        render: (dependent) => dependent.healthPlanValue != null ? formatCurrency(dependent.healthPlanValue) : '—',
      },
    ],
    defaultVisible: ['user.name', 'name', 'relationship'],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (dependent, router) => {
          router.push(`/departamento-pessoal/dependentes/detalhes/${dependent.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditHrEntities,
        onPress: (dependent, router) => {
          router.push(`/departamento-pessoal/dependentes/editar/${dependent.id}`)
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
          message: () => `Deseja excluir este dependente?`,
        },
        onPress: async (dependent, _, context) => {
          await context?.delete?.(dependent.id)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'relationships',
        label: 'Parentesco',
        type: 'select',
        multiple: true,
        options: Object.entries(DEPENDENT_RELATIONSHIP_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o parentesco',
      },
      {
        key: 'userIds',
        label: 'Colaboradores',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['users', 'filter', 'dependent-collaborators'],
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
            console.error('[Dependent Collaborator Filter] Error:', error)
            return { data: [], hasMore: false }
          }
        },
        placeholder: 'Selecione os colaboradores',
      },
      {
        key: 'irrfDeduction',
        label: 'Dedução IRRF',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Sim', value: 'true' },
          { label: 'Não', value: 'false' },
        ],
        placeholder: 'Selecione',
      },
      {
        key: 'salarioFamilia',
        label: 'Salário-Família',
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
    placeholder: 'Buscar dependentes...',
    debounce: 500,
  },

  export: {
    title: 'Dependentes',
    filename: 'dependentes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'name', label: 'Dependente', path: 'name' },
      { key: 'relationship', label: 'Parentesco', path: 'relationship', format: (value: any): string => value ? DEPENDENT_RELATIONSHIP_LABELS[value as DEPENDENT_RELATIONSHIP] : '—' },
      { key: 'cpf', label: 'CPF', path: 'cpf', format: (value: any): string => value ? formatCPF(value) : '—' },
      { key: 'irrfDeduction', label: 'Dedução IRRF', path: 'irrfDeduction', format: (value: any): string => value ? 'Sim' : 'Não' },
      { key: 'salarioFamilia', label: 'Salário-Família', path: 'salarioFamilia', format: (value: any): string => value ? 'Sim' : 'Não' },
      { key: 'healthPlanValue', label: 'Valor Plano', path: 'healthPlanValue', format: (value: any): string => value != null ? formatCurrency(value) : '—' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Dependente',
      route: '/departamento-pessoal/dependentes/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'dependente' : 'dependentes'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ dependentIds: Array.from(ids) })
        },
        canPerform: canDeleteHrEntities,
      },
    ],
  },
}
