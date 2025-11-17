import { View, ScrollView, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { useTheme } from '@/lib/theme'
import { spacing, fontSize } from '@/constants/design-system'
import type { Paint } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PaintProductionHistoryCardProps {
  paint: Paint
  maxHeight?: number
}

export function PaintProductionHistoryCard({
  paint,
  maxHeight = 400,
}: PaintProductionHistoryCardProps) {
  const { colors } = useTheme()

  // Get all productions from formulas
  const productions = paint.formulas
    ?.flatMap((formula) => formula.paintProduction || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []

  if (productions.length === 0) {
    return (
      <Card className="p-4">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="p-2 rounded-lg bg-primary/10">
            <Icon name="factory" size={20} className="text-primary" />
          </View>
          <Text className="text-lg font-semibold text-foreground">Histórico de Produção</Text>
        </View>

        <View className="items-center justify-center py-8">
          <Icon name="inbox" size={48} className="text-muted-foreground mb-2" />
          <Text className="text-sm text-muted-foreground text-center">
            Nenhuma produção registrada
          </Text>
        </View>
      </Card>
    )
  }

  // Calculate statistics
  const totalProductions = productions.length
  const totalQuantity = productions.reduce((sum, prod) => sum + (prod.quantity || 0), 0)
  const avgQuantity = totalQuantity / totalProductions

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="factory" size={20} className="text-primary" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">Histórico de Produção</Text>
          <Text className="text-xs text-muted-foreground">
            {totalProductions} {totalProductions === 1 ? 'produção' : 'produções'}
          </Text>
        </View>
      </View>

      {/* Statistics */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-muted/30 rounded-lg p-3">
          <Text className="text-xs text-muted-foreground mb-1">Total Produzido</Text>
          <Text className="text-lg font-semibold">{totalQuantity.toFixed(2)} L</Text>
        </View>
        <View className="flex-1 bg-muted/30 rounded-lg p-3">
          <Text className="text-xs text-muted-foreground mb-1">Média por Produção</Text>
          <Text className="text-lg font-semibold">{avgQuantity.toFixed(2)} L</Text>
        </View>
      </View>

      {/* Production List */}
      <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          {productions.map((production, index) => (
            <View
              key={production.id}
              className="bg-muted/30 rounded-lg p-3"
              style={[
                styles.productionItem,
                { borderLeftColor: colors.primary, borderLeftWidth: 3 },
              ]}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Produção #{totalProductions - index}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {format(new Date(production.createdAt), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </Text>
                </View>
                <Badge variant="secondary">
                  <Text className="text-xs font-medium">{production.quantity?.toFixed(2)} L</Text>
                </Badge>
              </View>

              {production.notes && (
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted-foreground">{production.notes}</Text>
                </View>
              )}

              {production.formula && (
                <View className="mt-2">
                  <Text className="text-xs text-muted-foreground">
                    Fórmula: {production.formula.description || 'Sem descrição'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </Card>
  )
}

const styles = StyleSheet.create({
  productionItem: {
    borderLeftWidth: 3,
  },
})
