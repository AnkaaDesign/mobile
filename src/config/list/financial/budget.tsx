import { View, StyleSheet } from 'react-native'
import type { ListConfig } from '@/components/list/types'
import type { TaskQuote } from '@/types/task-quote'
import { TASK_QUOTE_STATUS, TASK_QUOTE_STATUS_LABELS, SECTOR_PRIVILEGES } from '@/constants'
import { canEditQuote } from '@/utils/permissions/quote-permissions'
import { hasAnyPrivilege } from '@/utils'
import { formatCurrency } from '@/utils/formatters'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'

/**
 * Map TASK_QUOTE_STATUS to badge variant for consistent color coding
 */
function getQuoteStatusBadge(status: string | undefined | null): { variant: string } {
  switch (status) {
    case TASK_QUOTE_STATUS.PENDING:
      return { variant: 'secondary' }
    case TASK_QUOTE_STATUS.BUDGET_APPROVED:
      return { variant: 'approved' }
    case TASK_QUOTE_STATUS.BILLING_APPROVED:
      return { variant: 'approved' }
    case TASK_QUOTE_STATUS.UPCOMING:
      return { variant: 'pending' }
    case TASK_QUOTE_STATUS.DUE:
      return { variant: 'destructive' }
    case TASK_QUOTE_STATUS.PARTIAL:
      return { variant: 'inProgress' }
    case TASK_QUOTE_STATUS.SETTLED:
      return { variant: 'completed' }
    case TASK_QUOTE_STATUS.CANCELLED:
      return { variant: 'cancelled' }
    default:
      return { variant: 'secondary' }
  }
}

const styles = StyleSheet.create({
  nameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cellText: {
    fontSize: 12,
  },
  customersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})

/**
 * Budget list config — queries TaskQuotes.
 * Columns match the web budget page: LOGOMARCA, IDENTIFICADOR, CLIENTES, PREVISÃO, PRAZO, VALOR
 */
export const budgetListConfig: ListConfig<TaskQuote> = {
  key: 'financial-budget',
  title: 'Orcamentos',

  query: {
    hook: 'useTaskQuotesInfiniteMobile',
    // Web parity: budget list shows quotes that are still in the budget pipeline
    // (PENDING + BUDGET_APPROVED), default-sorted by statusOrder asc.
    // (Web budget-table.tsx adds a secondary `term asc`; mobile useSort is single-key
    // so that secondary sort is not expressed here — acceptable partial parity.)
    defaultSort: { field: 'statusOrder', direction: 'asc' },
    pageSize: 25,
    // Base where applied unless the user picks an explicit status filter, in which
    // case useList strips the conflicting `status` key from this base where so the
    // chosen filter wins.
    where: {
      status: { in: [TASK_QUOTE_STATUS.PENDING, TASK_QUOTE_STATUS.BUDGET_APPROVED] },
    },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          forecastDate: true,
          term: true,
          truck: {
            select: {
              plate: true,
            },
          },
        },
      },
      customerConfigs: {
        include: {
          customer: {
            select: {
              id: true,
              fantasyName: true,
              corporateName: true,
            },
          },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'budgetNumber',
        label: 'N.',
        sortable: true,
        width: 0.8,
        align: 'left',
        render: (quote: TaskQuote) => (
          <ThemedText style={[styles.cellText, { fontFamily: 'monospace' }]} numberOfLines={1}>
            {quote.budgetNumber ? `#${quote.budgetNumber.toString().padStart(4, '0')}` : '-'}
          </ThemedText>
        ),
      },
      {
        key: 'task.name',
        label: 'LOGOMARCA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (quote: TaskQuote) => (
          <ThemedText style={styles.nameText} numberOfLines={2}>
            {quote.task?.name || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'identificador',
        label: 'IDENTIF.',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (quote: TaskQuote) => (
          <ThemedText style={[styles.cellText, { fontFamily: 'monospace' }]} numberOfLines={1}>
            {quote.task?.serialNumber || (quote.task as any)?.truck?.plate || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'customerConfigs',
        label: 'CLIENTES',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (quote: TaskQuote) => {
          const configs = quote.customerConfigs
          if (!configs || configs.length === 0) return <ThemedText style={styles.cellText}>-</ThemedText>
          const names = configs
            .map((c) => c.customer?.corporateName || c.customer?.fantasyName || '')
            .filter(Boolean)
          if (names.length === 0) return <ThemedText style={styles.cellText}>-</ThemedText>
          if (names.length === 1) {
            return <ThemedText style={styles.cellText} numberOfLines={1}>{names[0]}</ThemedText>
          }
          return (
            <View style={styles.customersContainer}>
              <ThemedText style={styles.cellText} numberOfLines={1}>
                {names[0]}
              </ThemedText>
              <Badge variant="secondary" size="sm">
                <ThemedText style={{ fontSize: 10 }}>+{names.length - 1}</ThemedText>
              </Badge>
            </View>
          )
        },
      },
      {
        key: 'total',
        label: 'VALOR',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (quote: TaskQuote) => {
          if (!quote.total) return '-'
          return formatCurrency(Number(quote.total))
        },
        style: { fontWeight: '500' },
      },
      {
        key: 'task.forecastDate',
        label: 'PREVISÃO',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (quote: TaskQuote) => (quote.task as any)?.forecastDate,
        format: 'date',
      },
      {
        key: 'task.term',
        label: 'PRAZO',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (quote: TaskQuote) => (quote.task as any)?.term,
        format: 'date',
      },
      {
        key: 'createdAt',
        label: 'CRIADO EM',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (quote: TaskQuote) => quote.createdAt,
        format: 'date',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.8,
        align: 'center',
        render: (quote: TaskQuote) => {
          if (!quote.status) return '-'
          return TASK_QUOTE_STATUS_LABELS[quote.status as TASK_QUOTE_STATUS] || quote.status
        },
        format: 'badge',
        badge: (quote: TaskQuote) => getQuoteStatusBadge(quote.status),
      },
    ],
    defaultVisible: ['task.name', 'customerConfigs', 'total', 'task.term', 'status'],
    rowHeight: 52,
    actions: [
      {
        key: 'view',
        label: 'Ver Tarefa',
        icon: 'eye',
        variant: 'default',
        onPress: (quote, router) => {
          if (quote.task?.id) {
            router.push(`/producao/agenda/precificacao/${quote.task.id}`)
          }
        },
      },
      {
        key: 'edit',
        label: 'Editar Orcamento',
        icon: 'pencil',
        variant: 'default',
        canPerform: (user) => canEditQuote(user?.sector?.privileges || user?.sector || ''),
        onPress: (quote, router) => {
          if (quote.task?.id) {
            router.push(`/financeiro/orcamento/detalhes/${quote.task.id}`)
          }
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Pendente', value: TASK_QUOTE_STATUS.PENDING },
          { label: 'Orc. Aprovado', value: TASK_QUOTE_STATUS.BUDGET_APPROVED },
          { label: 'Fat. Aprovado', value: TASK_QUOTE_STATUS.BILLING_APPROVED },
          { label: 'A Vencer', value: TASK_QUOTE_STATUS.UPCOMING },
          { label: 'Vencido', value: TASK_QUOTE_STATUS.DUE },
          { label: 'Parcial', value: TASK_QUOTE_STATUS.PARTIAL },
          { label: 'Liquidado', value: TASK_QUOTE_STATUS.SETTLED },
          { label: 'Cancelado', value: TASK_QUOTE_STATUS.CANCELLED },
        ],
        placeholder: 'Todos os status',
      },
      {
        key: 'expiresAt',
        label: 'Data de Validade',
        type: 'date-range',
        placeholder: 'Data de Validade',
      },
      {
        key: 'createdAt',
        label: 'Data de Criacao',
        type: 'date-range',
        placeholder: 'Data de Criacao',
      },
    ],
    // No default status filter: the base query `where` already scopes the default
    // view to PENDING + BUDGET_APPROVED. Leaving this empty lets an explicit status
    // pick override the base where (useList strips the conflicting key).
    defaultValues: {},
  },

  search: {
    placeholder: 'Buscar por logomarca, serie, cliente...',
    debounce: 500,
  },

  actions: {
    create: {
      label: 'Criar Orçamento',
      route: '/financeiro/orcamento/cadastrar',
      // API: POST /task-quotes = ADMIN+COMMERCIAL only (no FINANCIAL, task-quote.controller.ts:134)
      canCreate: (user: any) => hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL]),
    },
  },

  emptyState: {
    icon: 'file-description',
    title: 'Nenhum orcamento encontrado',
    description: 'Nao ha orcamentos cadastrados com os filtros selecionados.',
  },
}
