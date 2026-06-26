// components/personnel-department/thirteenth/thirteenth-detail.tsx
// Shared read-only 13º salário detail body (avos breakdown, base média, parcelas).
// Used by the HR detail screen and the self-service "Meu 13º" detail screen.

import { View, StyleSheet } from 'react-native'
import { ThemedText, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { spacing } from '@/constants/design-system'
import { formatCurrency } from '@/utils'
import {
  thirteenthStatusBadgeVariant,
  getThirteenthStatusLabel,
  getNumericValue,
} from '@/config/list/personnel-department/thirteenths'
import type { Thirteenth } from '@/types'

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</ThemedText>
    </View>
  )
}

export function ThirteenthDetail({ thirteenth }: { thirteenth: Thirteenth }) {
  const { colors } = useTheme()
  const variant = thirteenthStatusBadgeVariant[thirteenth.status] ?? 'default'

  const base = getNumericValue(thirteenth.baseRemuneration)
  const avos = thirteenth.avos ?? 0
  // Valor cheio devido = base / 12 × avos (proporcional aos avos).
  const fullEntitlement = base > 0 ? (base / 12) * avos : 0
  const first = getNumericValue(thirteenth.firstInstallment)
  const second = getNumericValue(thirteenth.secondInstallment)
  const inss = getNumericValue(thirteenth.inss)
  const irrf = getNumericValue(thirteenth.irrf)

  return (
    <>
      {/* Header / general */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.headerRow}>
            <CardTitle>13º Salário · {thirteenth.year}</CardTitle>
            <Badge variant={variant} size="sm">
              {getThirteenthStatusLabel(thirteenth.status)}
            </Badge>
          </View>
        </CardHeader>
        <CardContent>
          {thirteenth.user?.name ? <Row label="Colaborador" value={thirteenth.user.name} /> : null}
          <Row label="Avos" value={`${avos}/12`} />
          <Row label="Base média (incl. variáveis)" value={base > 0 ? formatCurrency(base) : '—'} />
          <Row label="Valor cheio (proporcional)" value={fullEntitlement > 0 ? formatCurrency(fullEntitlement) : '—'} />
          {thirteenth.notes ? <Row label="Observações" value={thirteenth.notes} /> : null}
        </CardContent>
      </Card>

      {/* Avos breakdown */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Apuração dos avos</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemedText style={styles.hint}>
            Cada mês com ≥ 15 dias trabalhados conta como 1 avo (1/12). Avos a partir da admissão do contrato vigente.
          </ThemedText>
          <View style={[styles.avosBar, { borderColor: colors.border }]}>
            {Array.from({ length: 12 }).map((_, i) => {
              const filled = i < avos
              return (
                <View
                  key={i}
                  style={[
                    styles.avosCell,
                    {
                      backgroundColor: filled ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText style={[styles.avosCellText, filled && { color: colors.background }]}>{i + 1}</ThemedText>
                </View>
              )
            })}
          </View>
          <Row label="Total de avos" value={`${avos}/12`} />
        </CardContent>
      </Card>

      {/* Parcelas */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemedText style={styles.installmentHeader}>1ª parcela · venc. ≤ 30/Nov</ThemedText>
          <Row label="Valor (50%, sem descontos)" value={thirteenth.firstInstallment != null ? formatCurrency(first) : '—'} valueColor={colors.success} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ThemedText style={styles.installmentHeader}>2ª parcela · venc. ≤ 20/Dez</ThemedText>
          <Row label="Bruto" value={thirteenth.secondInstallment != null ? formatCurrency(second) : '—'} />
          {inss > 0 && <Row label="INSS (base exclusiva)" value={`- ${formatCurrency(inss)}`} valueColor={colors.destructive} />}
          {irrf > 0 && <Row label="IRRF (base exclusiva)" value={`- ${formatCurrency(irrf)}`} valueColor={colors.destructive} />}
          <Row
            label="Líquido 2ª parcela"
            value={thirteenth.secondInstallment != null ? formatCurrency(Math.max(0, second - inss - irrf)) : '—'}
            valueColor={colors.success}
          />
        </CardContent>
      </Card>
    </>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  label: { fontSize: 14, opacity: 0.7, flex: 1, marginRight: spacing.sm },
  value: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  hint: { fontSize: 12, opacity: 0.7, marginBottom: spacing.sm },
  installmentHeader: { fontSize: 13, fontWeight: '700', opacity: 0.8, marginBottom: 4, marginTop: 4 },
  divider: { height: 1, marginVertical: spacing.sm },
  avosBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  avosCell: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avosCellText: { fontSize: 13, fontWeight: '600' },
})
