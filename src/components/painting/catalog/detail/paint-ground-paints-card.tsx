import { View, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { spacing } from '@/constants/design-system'
import type { Paint } from '@/types'

interface PaintGroundPaintsCardProps {
  paint: Paint
}

export function PaintGroundPaintsCard({ paint }: PaintGroundPaintsCardProps) {
  if (!paint.paintGrounds || paint.paintGrounds.length === 0) {
    return null
  }

  const handlePaintPress = (paintId: string) => {
    router.push(`/pintura/catalogo/detalhes/${paintId}`)
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="layers" size={20} className="text-primary" />
        </View>
        <Text className="text-lg font-semibold text-foreground">Fundos Recomendados</Text>
      </View>

      {/* Ground Paints List */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {paint.paintGrounds.map((pg) => {
            const groundPaint = pg.groundPaint
            if (!groundPaint) return null

            return (
              <TouchableOpacity
                key={pg.id}
                onPress={() => handlePaintPress(groundPaint.id)}
                activeOpacity={0.7}
              >
                <Card className="w-48 overflow-hidden">
                  {/* Color Preview */}
                  <View
                    className="h-16"
                    style={{ backgroundColor: groundPaint.hex }}
                  />

                  {/* Paint Info */}
                  <View className="p-3 gap-2">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
                      {groundPaint.name}
                    </Text>

                    <View className="flex-row flex-wrap gap-1">
                      {groundPaint.paintType && (
                        <Badge variant="secondary">
                          <Text className="text-xs">{groundPaint.paintType.name}</Text>
                        </Badge>
                      )}

                      {groundPaint.paintBrand && (
                        <Badge variant="outline">
                          <Text className="text-xs">{groundPaint.paintBrand.name}</Text>
                        </Badge>
                      )}
                    </View>

                    {groundPaint.code && (
                      <Text className="text-xs text-muted-foreground">
                        Código: {groundPaint.code}
                      </Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </Card>
  )
}
