import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { DetailCard } from '@/components/ui/detail-page-layout'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { spacing, fontSize } from '@/constants/design-system'
import type { Paint } from '@/types'
import { PaintPreview } from '@/components/painting/preview/painting-preview'
import { useTheme } from '@/lib/theme'

// Badge colors - unified neutral, more subtle
const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },
};

interface PaintGroundPaintsCardProps {
  paint: Paint
}

export function PaintGroundPaintsCard({ paint }: PaintGroundPaintsCardProps) {
  const { isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;
  if (!paint.paintGrounds || paint.paintGrounds.length === 0) {
    return null
  }

  const handlePaintPress = (paintId: string) => {
    router.push(`/pintura/catalogo/detalhes/${paintId}`)
  }

  return (
    <DetailCard title="Fundos Recomendados" icon="layers-subtract">
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
                  <PaintPreview
                    paint={groundPaint}
                    baseColor={groundPaint.hex}
                    width={192}
                    height={64}
                    borderRadius={0}
                    style={{ width: '100%', height: 64 }}
                  />

                  {/* Paint Info */}
                  <View className="p-3 gap-2">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
                      {groundPaint.name}
                    </Text>

                    <View className="flex-row flex-wrap gap-1">
                      {groundPaint.paintType && (
                        <Badge style={{ ...styles.badge, backgroundColor: badgeStyle.bg }}>
                          <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{groundPaint.paintType.name}</Text>
                        </Badge>
                      )}

                      {groundPaint.paintBrand && (
                        <Badge style={{ ...styles.badge, backgroundColor: badgeStyle.bg }}>
                          <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{groundPaint.paintBrand.name}</Text>
                        </Badge>
                      )}
                    </View>

                    {groundPaint.code && (
                      <Text className="text-xs text-muted-foreground">
                        Codigo: {groundPaint.code}
                      </Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </DetailCard>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
