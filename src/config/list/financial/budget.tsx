import { View, StyleSheet } from 'react-native'
import type { ListConfig } from '@/components/list/types'
import type { TaskQuote } from '@/types/task-quote'
import { TASK_QUOTE_STATUS } from '@/constants'
import { canEditQuote } from '@/utils/permissions/quote-permissions'
import { formatCurrency } from '@/utils/formatters'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'

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
    where: {
      status: TASK_QUOTE_STATUS.PENDING,
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
    ],
    defaultVisible: ['task.name', 'identificador', 'task.term'],
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
  },

  search: {
    placeholder: 'Buscar por logomarca, serie, cliente...',
    debounce: 500,
  },

  emptyState: {
    icon: 'file-description',
    title: 'Nenhum orcamento encontrado',
    description: 'Nao ha orcamentos cadastrados com os filtros selecionados.',
  },
}
