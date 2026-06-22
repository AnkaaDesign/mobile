import { View } from 'react-native'
import type { ListConfig } from '@/components/list/types'
import type { Termination, TerminationItem } from '@/types'
import { TERMINATION_TYPE, TERMINATION_STATUS } from '@/constants/enums'
import {
  TERMINATION_TYPE_LABELS,
  TERMINATION_STATUS_LABELS,
} from '@/constants/enum-labels'
import { Badge, getBadgeVariantFromStatus } from '@/components/ui/badge'
import { ThemedText } from '@/components/ui/themed-text'
import { extendedColors } from '@/lib/theme/extended-colors'
import { canEditHrEntities, canDeleteDpRecords } from '@/utils/permissions/entity-permissions'
import { formatCurrency } from '@/utils/number'
import { formatDate } from '@/utils/date'

// Não-finais: por padrão a lista mostra apenas rescisões em andamento
// (Concluída/Cancelada ficam ocultas até serem filtradas explicitamente).
// Mirror do web (TerminationList.ACTIVE_TERMINATION_STATUSES).
const ACTIVE_TERMINATION_STATUSES: TERMINATION_STATUS[] = Object.values(
  TERMINATION_STATUS,
).filter(
  (status) =>
    status !== TERMINATION_STATUS.COMPLETED &&
    status !== TERMINATION_STATUS.CANCELLED,
) as TERMINATION_STATUS[]

const FINAL_STATUSES: TERMINATION_STATUS[] = [
  TERMINATION_STATUS.COMPLETED,
  TERMINATION_STATUS.CANCELLED,
]

function isTerminationFinal(t: Termination): boolean {
  return FINAL_STATUSES.includes(t.status)
}

// Pagamento em atraso: prazo no passado, rescisão ainda em andamento e ainda
// não paga (mesmo que paga em atraso → deixa de ser "atrasado"). Mirror do web.
function isPaymentOverdue(t: Termination): boolean {
  if (!t.paymentDueDate) return false
  if (isTerminationFinal(t)) return false
  if (t.paymentDate) return false
  return new Date(t.paymentDueDate).getTime() < Date.now()
}

// Líquido = soma de items[].amount (positivos − descontos). null quando não há
// verbas lançadas ainda. Mirror do web (getTerminationNet).
function getTerminationNet(t: Termination): number | null {
  const items = (t.items ?? []) as TerminationItem[]
  if (items.length === 0) return null
  return items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

export const terminationsListConfig: ListConfig<Termination> = {
  key: 'hr-terminations',
  title: 'Rescisões',

  query: {
    hook: 'useTerminationsInfinite',
    mutationsHook: 'useTerminationMutations',
    batchMutationsHook: 'useTerminationBatchMutations',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      user: { include: { position: true, sector: true } },
      items: true,
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
        render: (t) => t.user?.name || '—',
        style: { fontWeight: '500' },
      },
      {
        key: 'user.sector',
        label: 'SETOR',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (t) => (t.user as any)?.sector?.name || '—',
      },
      {
        key: 'user.position',
        label: 'CARGO',
        sortable: false,
        width: 1.7,
        align: 'left',
        render: (t) => (t.user as any)?.position?.name || '—',
      },
      {
        key: 'type',
        label: 'TIPO',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (t) => (t.type ? TERMINATION_TYPE_LABELS[t.type] : '—'),
        format: 'badge',
        badge: () => ({ variant: 'secondary' }),
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (t) => (t.status ? TERMINATION_STATUS_LABELS[t.status] : '—'),
        format: 'badge',
        badge: (t: Termination) => ({
          variant: (t.status
            ? getBadgeVariantFromStatus(t.status, 'TERMINATION')
            : 'secondary') as any,
        }),
      },
      {
        key: 'terminationDate',
        label: 'DATA DA RESCISÃO',
        sortable: true,
        width: 1.3,
        align: 'left',
        render: (t) => t.terminationDate,
        format: 'date',
      },
      {
        key: 'paymentDueDate',
        label: 'PRAZO DE PAGAMENTO',
        sortable: true,
        width: 1.6,
        align: 'left',
        render: (t) => {
          if (!t.paymentDueDate) return '—'
          const overdue = isPaymentOverdue(t)
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: overdue ? extendedColors.red[600] : undefined,
                }}
                numberOfLines={1}
              >
                {formatDate(t.paymentDueDate)}
              </ThemedText>
              {overdue ? (
                <Badge variant="destructive" size="sm">
                  <ThemedText style={{ fontSize: 10, color: '#fff' }}>Atrasado</ThemedText>
                </Badge>
              ) : null}
            </View>
          )
        },
      },
      {
        key: 'net',
        label: 'LÍQUIDO',
        sortable: false,
        width: 1.4,
        align: 'right',
        render: (t) => {
          const net = getTerminationNet(t)
          if (net === null) return '—'
          return (
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'right',
                color: net < 0 ? extendedColors.red[600] : undefined,
              }}
              numberOfLines={1}
            >
              {formatCurrency(net)}
            </ThemedText>
          )
        },
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (t) => t.createdAt,
        format: 'date',
      },
    ],
    defaultVisible: [
      'user.name',
      'user.sector',
      'user.position',
      'type',
      'status',
      'terminationDate',
      'paymentDueDate',
      'net',
    ],
    rowHeight: 72,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (t, router) => {
          router.push(`/recursos-humanos/rescisoes/detalhes/${t.id}`)
        },
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        canPerform: canEditHrEntities,
        onPress: (t, router) => {
          router.push(`/recursos-humanos/rescisoes/editar/${t.id}`)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        canPerform: canDeleteDpRecords,
        // Excluir apenas rescisões CANCELADAS (mirror do guard no servidor e do
        // detalhe): em andamento devem ser canceladas antes; concluídas nunca.
        visible: (t) => t.status === TERMINATION_STATUS.CANCELLED,
        confirm: {
          title: 'Confirmar Exclusão',
          message: (t) =>
            `Tem certeza que deseja excluir a rescisão${t.user?.name ? ` de "${t.user.name}"` : ''}? Esta ação não pode ser desfeita.`,
        },
        onPress: async (t, _, context) => {
          await context?.delete?.(t.id)
        },
      },
    ],
  },

  filters: {
    // Por padrão exibe apenas rescisões em andamento (oculta Concluída/Cancelada
    // até o usuário filtrar explicitamente). Mirror do web. As chips de status
    // resultantes são removíveis para revelar as finais.
    defaultValues: {
      statuses: ACTIVE_TERMINATION_STATUSES,
    },
    fields: [
      {
        key: 'types',
        label: 'Tipo de Rescisão',
        type: 'select',
        multiple: true,
        options: Object.entries(TERMINATION_TYPE_LABELS).map(([key, label]) => ({
          label,
          value: key,
        })),
        placeholder: 'Selecione o tipo',
      },
      {
        key: 'statuses',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: Object.entries(TERMINATION_STATUS_LABELS).map(([key, label]) => ({
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
        key: 'createdAt',
        label: 'Data de Criação',
        type: 'date-range',
        placeholder: 'Data de Criação',
      },
      {
        key: 'terminationDate',
        label: 'Data da Rescisão',
        type: 'date-range',
        placeholder: 'Data da Rescisão',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por colaborador, motivo ou artigo',
    debounce: 500,
  },

  export: {
    title: 'Rescisões',
    filename: 'rescisoes',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'user', label: 'Colaborador', path: 'user.name' },
      { key: 'sector', label: 'Setor', path: 'user.sector.name' },
      { key: 'position', label: 'Cargo', path: 'user.position.name' },
      { key: 'type', label: 'Tipo', path: 'type', format: (value: any): string => (value ? TERMINATION_TYPE_LABELS[value as TERMINATION_TYPE] : '—') },
      { key: 'status', label: 'Status', path: 'status', format: (value: any): string => (value ? TERMINATION_STATUS_LABELS[value as TERMINATION_STATUS] : '—') },
      { key: 'terminationDate', label: 'Data da Rescisão', path: 'terminationDate', format: 'date' },
      { key: 'paymentDueDate', label: 'Prazo de Pagamento', path: 'paymentDueDate', format: 'date' },
      { key: 'paidAmount', label: 'Valor Pago', path: 'paidAmount', format: (value: any): string => (value != null ? formatCurrency(Number(value)) : '—') },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Cadastrar Rescisão',
      route: '/recursos-humanos/rescisoes/cadastrar',
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
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'rescisão' : 'rescisões'}?`,
        },
        onPress: async (ids, actions) => {
          await actions?.batchDeleteAsync?.({ terminationIds: Array.from(ids) })
        },
        canPerform: canDeleteDpRecords,
      },
    ],
  },
}
