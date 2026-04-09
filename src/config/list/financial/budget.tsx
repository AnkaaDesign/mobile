import { View, StyleSheet } from 'react-native'
import type { ListConfig } from '@/components/list/types'
import type { TaskQuote } from '@/types/task-quote'
import { TASK_QUOTE_STATUS, TASK_QUOTE_STATUS_LABELS } from '@/constants'
import { canEditQuote } from '@/utils/permissions/quote-permissions'
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
    case TASK_QUOTE_STATUS.COMMERCIAL_APPROVED:
      return { variant: 'processing' }
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
    defaultSort: { field: 'budgetNumber', direction: 'desc' },
    pageSize: 25,
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
    defaultVisible: ['task.name', 'customerConfigs', 'total', 'task.term'],
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
        canPerform: (user) => canEditQuote(user?.sector || ''),
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
          { label: 'Aprov. Comercial', value: TASK_QUOTE_STATUS.COMMERCIAL_APPROVED },
          { label: 'Fat. Aprovado', value: TASK_QUOTE_STATUS.BILLING_APPROVED },
          { label: 'A Vencer', value: TASK_QUOTE_STATUS.UPCOMING },
          { label: 'Vencido', value: TASK_QUOTE_STATUS.DUE },
          { label: 'Parcial', value: TASK_QUOTE_STATUS.PARTIAL },
          { label: 'Liquidado', value: TASK_QUOTE_STATUS.SETTLED },
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
    defaultValues: {
      status: TASK_QUOTE_STATUS.PENDING,
    },
  },

  search: {
    placeholder: 'Buscar por logomarca, serie, cliente...',
    debounce: 500,
  },

  actions: {
    create: {
      label: 'Criar Orçamento',
      route: '/financeiro/orcamento/cadastrar',
      canCreate: (user: any) => canEditQuote(user?.sector?.privileges || user?.sector || ''),
    },
  },

  emptyState: {
    icon: 'file-description',
    title: 'Nenhum orcamento encontrado',
    description: 'Nao ha orcamentos cadastrados com os filtros selecionados.',
  },
}
