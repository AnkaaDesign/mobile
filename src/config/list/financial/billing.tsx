import { View, StyleSheet } from 'react-native'
import type { ListConfig } from '@/components/list/types'
import {
  TASK_QUOTE_STATUS,
  TASK_QUOTE_STATUS_LABELS,
} from '@/constants'
import { formatCurrency } from '@/utils/formatters'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'

/**
 * Map TASK_QUOTE_STATUS to badge variant for consistent color coding
 * Matches the web QuoteStatusBadge component
 */
function getQuoteStatusBadge(status: string | undefined | null): { variant: string } {
  switch (status) {
    case TASK_QUOTE_STATUS.PENDING:
      return { variant: 'secondary' }
    case TASK_QUOTE_STATUS.BUDGET_APPROVED:
      return { variant: 'approved' }
    case TASK_QUOTE_STATUS.VERIFIED_BY_FINANCIAL:
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
 * Billing list config — queries TASKS with shouldDisplayForFinancial,
 * matching the web implementation exactly.
 * Each row is a Task with nested quote/customer/truck data.
 */
interface BillingTask {
  id: string;
  name?: string | null;
  serialNumber?: string | null;
  finishedAt?: string | null;
  customer?: { id?: string; fantasyName?: string | null; corporateName?: string | null } | null;
  truck?: { plate?: string | null; chassisNumber?: string | null } | null;
  quote?: {
    total?: number | null;
    status?: string | null;
    statusOrder?: number | null;
    customerConfigs?: Array<{
      customer?: { id?: string; fantasyName?: string | null; corporateName?: string | null } | null;
    }> | null;
  } | null;
}

export const billingListConfig: ListConfig<BillingTask> = {
  key: 'financial-billing',
  title: 'Faturamento',

  query: {
    hook: 'useTasksInfiniteMobile',
    defaultSort: { field: 'finishedAt', direction: 'desc' },
    pageSize: 25,
    forcedParams: {
      shouldDisplayForFinancial: true,
    },
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true,
          corporateName: true,
        },
      },
      truck: {
        select: {
          chassisNumber: true,
          plate: true,
        },
      },
      quote: {
        select: {
          total: true,
          status: true,
          statusOrder: true,
          customerConfigs: {
            select: {
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
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'LOGOMARCA',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (task: BillingTask) => (
          <ThemedText style={styles.nameText} numberOfLines={2}>
            {task.name || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'identificador',
        label: 'IDENTIF.',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (task: BillingTask) => (
          <ThemedText style={[styles.cellText, { fontFamily: 'monospace' }]} numberOfLines={1}>
            {task.serialNumber || task.truck?.plate || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'invoiceToCustomers',
        label: 'FATURAR PARA',
        sortable: false,
        width: 2.0,
        align: 'left',
        render: (task: BillingTask) => {
          const configs = task.quote?.customerConfigs
          if (!configs || configs.length === 0) {
            return (
              <ThemedText style={styles.cellText} numberOfLines={1}>
                {task.customer?.corporateName || task.customer?.fantasyName || '-'}
              </ThemedText>
            )
          }
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
        key: 'finishedAt',
        label: 'FINALIZADO',
        sortable: true,
        width: 1.2,
        align: 'left',
        render: (task: BillingTask) => task.finishedAt,
        format: 'date',
      },
      {
        key: 'quoteTotal',
        label: 'VALOR',
        sortable: false,
        width: 1.2,
        align: 'right',
        render: (task: BillingTask) => {
          if (!task.quote?.total) return '-'
          return formatCurrency(Number(task.quote.total))
        },
        style: { fontWeight: '500' },
      },
      {
        key: 'quote.statusOrder',
        label: 'STATUS',
        sortable: true,
        width: 1.5,
        align: 'center',
        render: (task: BillingTask) => {
          if (!task.quote?.status) return '-'
          return TASK_QUOTE_STATUS_LABELS[task.quote.status as TASK_QUOTE_STATUS] || task.quote.status
        },
        format: 'badge',
        badge: (task: BillingTask) => getQuoteStatusBadge(task.quote?.status),
      },
    ],
    defaultVisible: ['name', 'identificador', 'quoteTotal', 'quote.statusOrder', 'invoiceToCustomers'],
    rowHeight: 52,
    actions: [
      {
        key: 'view',
        label: 'Ver Orcamento',
        icon: 'eye',
        variant: 'default',
        onPress: (task, router) => {
          router.push(`/financeiro/faturamento/detalhes/${task.id}`)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'quoteStatus',
        label: 'Status Faturamento',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Orc. Aprovado', value: TASK_QUOTE_STATUS.BUDGET_APPROVED },
          { label: 'Verif. Financeiro', value: TASK_QUOTE_STATUS.VERIFIED_BY_FINANCIAL },
          { label: 'Fat. Aprovado', value: TASK_QUOTE_STATUS.BILLING_APPROVED },
          { label: 'A Vencer', value: TASK_QUOTE_STATUS.UPCOMING },
          { label: 'Vencido', value: TASK_QUOTE_STATUS.DUE },
          { label: 'Parcial', value: TASK_QUOTE_STATUS.PARTIAL },
        ],
        placeholder: 'Todos os status',
      },
      {
        key: 'finishedAt',
        label: 'Finalizado Em',
        type: 'date-range',
        placeholder: 'Data de finalizacao',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por logomarca, serie, placa, cliente...',
    debounce: 300,
  },

  emptyState: {
    icon: 'file-invoice',
    title: 'Nenhuma tarefa de faturamento',
    description: 'Nao ha tarefas para faturamento com os filtros atuais.',
  },
}
