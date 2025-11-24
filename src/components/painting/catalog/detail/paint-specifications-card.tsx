import { View, TouchableOpacity, StyleSheet, ScrollView, Platform, ToastAndroid, Alert } from 'react-native'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/lib/theme'
import { borderRadius } from '@/constants/design-system'
import {
  PAINT_FINISH_LABELS,
  TRUCK_MANUFACTURER_LABELS,
  COLOR_PALETTE_LABELS,
} from '@/constants'
import type { Paint } from '@/types'
import * as Clipboard from 'expo-clipboard'
import { PaintPreview } from '@/components/painting/preview/painting-preview'

// Tag badge colors - inverted (dark in light mode, light in dark mode)
const TAG_BADGE_COLORS = {
  light: { bg: '#404040', text: '#f5f5f5' },  // neutral-700, neutral-100
  dark: { bg: '#d4d4d4', text: '#262626' },   // neutral-300, neutral-800
};

interface PaintSpecificationsCardProps {
  paint: Paint
}

export function PaintSpecificationsCard({ paint }: PaintSpecificationsCardProps) {
  const { colors, isDark } = useTheme()
  const tagBadgeStyle = isDark ? TAG_BADGE_COLORS.dark : TAG_BADGE_COLORS.light

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  const rgbToLab = (r: number, g: number, b: number): { l: number; a: number; b: number } => {
    // Convert RGB to XYZ
    let varR = r / 255
    let varG = g / 255
    let varB = b / 255

    if (varR > 0.04045) varR = Math.pow((varR + 0.055) / 1.055, 2.4)
    else varR = varR / 12.92
    if (varG > 0.04045) varG = Math.pow((varG + 0.055) / 1.055, 2.4)
    else varG = varG / 12.92
    if (varB > 0.04045) varB = Math.pow((varB + 0.055) / 1.055, 2.4)
    else varB = varB / 12.92

    varR = varR * 100
    varG = varG * 100
    varB = varB * 100

    const X = varR * 0.4124 + varG * 0.3576 + varB * 0.1805
    const Y = varR * 0.2126 + varG * 0.7152 + varB * 0.0722
    const Z = varR * 0.0193 + varG * 0.1192 + varB * 0.9505

    let varX = X / 95.047
    let varY = Y / 100.0
    let varZ = Z / 108.883

    if (varX > 0.008856) varX = Math.pow(varX, 1 / 3)
    else varX = 7.787 * varX + 16 / 116
    if (varY > 0.008856) varY = Math.pow(varY, 1 / 3)
    else varY = 7.787 * varY + 16 / 116
    if (varZ > 0.008856) varZ = Math.pow(varZ, 1 / 3)
    else varZ = 7.787 * varZ + 16 / 116

    const L = 116 * varY - 16
    const A = 500 * (varX - varY)
    const B = 200 * (varY - varZ)

    return { l: Math.round(L), a: Math.round(A), b: Math.round(B) }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text)
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} copiado!`, ToastAndroid.SHORT)
      } else {
        Alert.alert('Copiado', `${label} copiado para área de transferência`)
      }
    } catch (error) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Erro ao copiar', ToastAndroid.SHORT)
      } else {
        Alert.alert('Erro', 'Erro ao copiar para área de transferência')
      }
    }
  }

  const rgb = hexToRgb(paint.hex)
  const lab = rgb ? rgbToLab(rgb.r, rgb.g, rgb.b) : null

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="info" size={20} className="text-primary" />
        </View>
        <Text className="text-lg font-semibold text-foreground">Especificações</Text>
      </View>

      {/* Color Information */}
      <View className="gap-3 mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Icon name="palette" size={16} className="text-muted-foreground" />
          <Text className="text-sm font-semibold text-muted-foreground">Cor</Text>
        </View>

        <View className="bg-muted/30 rounded-lg p-3">
          <View className="flex-row items-start gap-4">
            {/* Color Preview - uses stored image if available, falls back to hex */}
            <View
              style={[
                styles.colorPreview,
                { borderColor: colors.border, overflow: 'hidden' },
              ]}
            >
              <PaintPreview
                paint={paint}
                baseColor={paint.hex}
                width={96}
                height={96}
                borderRadius={0}
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            {/* Color Codes */}
            <View className="flex-1 gap-3">
              {/* HEX */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-muted-foreground">HEX</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-mono text-foreground">{paint.hex.toUpperCase()}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(paint.hex.toUpperCase(), 'HEX')}
                  >
                    <Icon name="copy" size={16} style={{ color: colors.foreground, opacity: 0.5 }} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* RGB */}
              {rgb && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-muted-foreground">RGB</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-mono text-foreground">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(`${rgb.r}, ${rgb.g}, ${rgb.b}`, 'RGB')
                      }
                    >
                      <Icon name="copy" size={16} style={{ color: colors.foreground, opacity: 0.5 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* LAB */}
              {lab && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-muted-foreground">LAB</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-mono text-foreground">{`L:${lab.l} a:${lab.a} b:${lab.b}`}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(`L:${lab.l} a:${lab.a} b:${lab.b}`, 'LAB')
                      }
                    >
                      <Icon name="copy" size={16} style={{ color: colors.foreground, opacity: 0.5 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Basic Information */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted-foreground mb-1">
          Informações Básicas
        </Text>

        {paint.code && (
          <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <Text className="text-sm text-muted-foreground">Código</Text>
            <Text className="text-sm font-medium">{paint.code}</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
          <Text className="text-sm text-muted-foreground">Marca</Text>
          <Text className="text-sm font-medium">{paint.paintBrand?.name || 'N/A'}</Text>
        </View>

        <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
          <Text className="text-sm text-muted-foreground">Acabamento</Text>
          <Text className="text-sm font-medium">{PAINT_FINISH_LABELS[paint.finish]}</Text>
        </View>

        {paint.manufacturer && (
          <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <Text className="text-sm text-muted-foreground">Fabricante</Text>
            <Text className="text-sm font-medium">{TRUCK_MANUFACTURER_LABELS[paint.manufacturer]}</Text>
          </View>
        )}

        {paint.palette && (
          <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <Text className="text-sm text-muted-foreground">Paleta de Cor</Text>
            <Text className="text-sm font-medium">{COLOR_PALETTE_LABELS[paint.palette]}</Text>
          </View>
        )}

        {paint.paintType && (
          <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <Text className="text-sm text-muted-foreground">Tipo de Tinta</Text>
            <Text className="text-sm font-medium">{paint.paintType.name}</Text>
          </View>
        )}

        {paint.tags && paint.tags.length > 0 && (
          <View className="bg-muted/30 rounded-lg px-3 py-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground mr-3">Tags</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxWidth: '70%' }}
              >
                <View className="flex-row gap-1">
                  {paint.tags.map((tag) => (
                    <Badge
                      key={tag}
                      style={[styles.tagBadge, { backgroundColor: tagBadgeStyle.bg }]}
                    >
                      <Text style={[styles.tagBadgeText, { color: tagBadgeStyle.text }]}>
                        {tag}
                      </Text>
                    </Badge>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  colorPreview: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
})
