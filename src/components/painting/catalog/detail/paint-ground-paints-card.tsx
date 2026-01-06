import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { spacing, fontSize } from '@/constants/design-system'
import type { Paint } from '@/types'
import { PaintPreview } from '@/components/painting/preview/painting-preview'
import { useTheme } from '@/lib/theme'

// Badge colors - unified neutral, more subtle
const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },  // neutral-200/70, neutral-600
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },      // neutral-700/50, neutral-300
};

interface PaintGroundPaintsCardProps {
  paint: Paint
}

export function PaintGroundPaintsCard({ paint }: PaintGroundPaintsCardProps) {
  const { colors, isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;
  if (!paint.paintGrounds || paint.paintGrounds.length === 0) {
    return null
  }

  const handlePaintPress = (paintId: string) => {
    router.push(`/pintura/catalogo/detalhes/${paintId}`)
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Icon name="layers" size={20} color={colors.mutedForeground} />
          <Text style={styles.title}>Fundos Recomendados</Text>
        </View>
      </View>

      <View style={styles.content}>
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
                  {/* Color Preview - uses stored image if available, falls back to hex */}
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
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
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
