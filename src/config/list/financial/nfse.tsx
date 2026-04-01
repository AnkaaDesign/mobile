import type { ListConfig } from '@/components/list/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'
import { fontWeight } from '@/constants/design-system'

interface NfseListItem {
  id: number;
  numeroNotaFiscal: number;
  dataEmissao: string;
  situacao: number;
  descricaoSituacao: string;
  cancelada: boolean;
  emitida: boolean;
  tomadorCnpjCpf: string;
  tomadorRazaoNome: string;
  valorDoc: number;
  valorServico: number;
  valorISS: number;
  invoiceId?: string | null;
  taskName?: string | null;
  taskSerialNumber?: string | null;
  customerName?: string | null;
  nfseDocumentId?: string | null;
}

const styles = StyleSheet.create({
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: 12,
  },
  cellText: {
    fontSize: 12,
  },
  tomadorContainer: {
    gap: 2,
  },
  subtitleText: {
    fontSize: 10,
    opacity: 0.6,
  },
})

function formatCnpjCpf(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

function getSituacaoBadge(item: NfseListItem): { variant: string; label: string } {
  if (item.cancelada) {
    return { variant: 'gray', label: 'Cancelada' }
  }
  if (item.emitida) {
    return { variant: 'green', label: 'Emitida' }
  }
  return { variant: 'amber', label: item.descricaoSituacao || String(item.situacao) }
}

export const nfseListConfig: ListConfig<NfseListItem & { id: any }> = {
  key: 'financial-nfse',
  title: 'Notas Fiscais',

  query: {
    hook: 'useNfseListInfinite',
    defaultSort: { field: 'dataEmissao', direction: 'desc' },
    pageSize: 50,
  },

  table: {
    columns: [
      {
        key: 'numeroNotaFiscal',
        label: 'NUM.',
        sortable: false,
        width: 0.8,
        align: 'left',
        render: (item: NfseListItem) => (
          <ThemedText style={styles.nameText}>
            {item.numeroNotaFiscal}
          </ThemedText>
        ),
      },
      {
        key: 'dataEmissao',
        label: 'EMISSAO',
        sortable: false,
        width: 1.2,
        align: 'left',
        render: (item: NfseListItem) =>
          item.dataEmissao ? formatDate(item.dataEmissao) : '-',
        format: 'date',
      },
      {
        key: 'taskName',
        label: 'TAREFA',
        sortable: false,
        width: 1.5,
        align: 'left',
        render: (item: NfseListItem) => (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {item.taskName || '-'}
          </ThemedText>
        ),
      },
      {
        key: 'tomadorRazaoNome',
        label: 'TOMADOR',
        sortable: false,
        width: 2.5,
        align: 'left',
        render: (item: NfseListItem) => {
          const name = item.customerName || item.tomadorRazaoNome
          if (!name && !item.tomadorCnpjCpf) return <ThemedText style={styles.cellText}>-</ThemedText>
          return (
            <View style={styles.tomadorContainer}>
              <ThemedText style={styles.nameText} numberOfLines={1}>
                {name || item.tomadorRazaoNome || '-'}
              </ThemedText>
              {item.tomadorCnpjCpf && (
                <ThemedText style={styles.subtitleText} numberOfLines={1}>
                  {formatCnpjCpf(item.tomadorCnpjCpf)}
                </ThemedText>
              )}
            </View>
          )
        },
      },
      {
        key: 'valorDoc',
        label: 'VALOR',
        sortable: false,
        width: 1.4,
        align: 'left',
        render: (item: NfseListItem) => (
          <ThemedText style={styles.cellText}>
            {formatCurrency(item.valorDoc)}
          </ThemedText>
        ),
      },
      {
        key: 'valorISS',
        label: 'ISS',
        sortable: false,
        width: 1.0,
        align: 'left',
        render: (item: NfseListItem) => (
          <ThemedText style={styles.cellText}>
            {formatCurrency(item.valorISS)}
          </ThemedText>
        ),
      },
      {
        key: 'situacao',
        label: 'SITUACAO',
        sortable: false,
        width: 1.2,
        align: 'center',
        render: (item: NfseListItem) => {
          const { variant, label } = getSituacaoBadge(item)
          return (
            <Badge variant={variant as any} size="sm">
              <ThemedText style={{ fontSize: 10 }} numberOfLines={1} ellipsizeMode="tail">{label}</ThemedText>
            </Badge>
          )
        },
      },
    ],
    defaultVisible: ['tomadorRazaoNome', 'valorDoc', 'situacao'],
    rowHeight: 52,
    actions: [
      {
        key: 'view',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (item, router) => {
          router.push(`/financeiro/notas-fiscais/detalhes/${item.id}`)
        },
      },
    ],
  },

  filters: {
    fields: [
      {
        key: 'situacao',
        label: 'Situacao',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Emitida', value: '1' },
          { label: 'Cancelada', value: '4' },
        ],
        placeholder: 'Todas as situacoes',
      },
      {
        key: 'dataEmissaoInicial',
        label: 'Data Emissao (De)',
        type: 'date-range',
        placeholder: 'Data inicial',
      },
      {
        key: 'dataEmissaoFinal',
        label: 'Data Emissao (Ate)',
        type: 'date-range',
        placeholder: 'Data final',
      },
    ],
  },

  search: {
    placeholder: 'Buscar por tomador, CNPJ, numero...',
    debounce: 300,
  },

  emptyState: {
    icon: 'file-invoice',
    title: 'Nenhuma nota fiscal encontrada',
    description: 'Nenhuma NFS-e foi encontrada com os filtros selecionados.',
  },
}
