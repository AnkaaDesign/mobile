import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { useTheme } from '@/lib/theme'
import { spacing, fontSize, borderRadius } from '@/constants/design-system'
import {
  PAINT_FINISH_LABELS,
  TRUCK_MANUFACTURER_LABELS,
  COLOR_PALETTE_LABELS,
} from '@/constants'
import type { Paint } from '@/types'
import * as Clipboard from 'expo-clipboard'
import { toast } from 'sonner-native'

interface PaintSpecificationsCardProps {
  paint: Paint
}

export function PaintSpecificationsCard({ paint }: PaintSpecificationsCardProps) {
  const { colors } = useTheme()

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
      toast.success(`${label} copiado!`)
    } catch (error) {
      toast.error('Erro ao copiar')
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
            {/* Color Preview */}
            <View
              style={[
                styles.colorPreview,
                { backgroundColor: paint.hex, borderColor: colors.border },
              ]}
            />

            {/* Color Codes */}
            <View className="flex-1 gap-2">
              {/* HEX */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-muted-foreground">HEX</Text>
                <View className="flex-row items-center gap-2">
                  <View className="bg-muted rounded px-2 py-1">
                    <Text className="text-sm font-mono">{paint.hex.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(paint.hex.toUpperCase(), 'HEX')}
                  >
                    <Icon name="copy" size={16} className="text-muted-foreground" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* RGB */}
              {rgb && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-muted-foreground">RGB</Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-muted rounded px-2 py-1">
                      <Text className="text-sm font-mono">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(`${rgb.r}, ${rgb.g}, ${rgb.b}`, 'RGB')
                      }
                    >
                      <Icon name="copy" size={16} className="text-muted-foreground" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* LAB */}
              {lab && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-muted-foreground">LAB</Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-muted rounded px-2 py-1">
                      <Text className="text-sm font-mono">{`L:${lab.l} a:${lab.a} b:${lab.b}`}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(`L:${lab.l} a:${lab.a} b:${lab.b}`, 'LAB')
                      }
                    >
                      <Icon name="copy" size={16} className="text-muted-foreground" />
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
          <Badge variant="secondary">
            <Text className="text-xs">{PAINT_FINISH_LABELS[paint.finish]}</Text>
          </Badge>
        </View>

        {paint.manufacturer && (
          <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <Text className="text-sm text-muted-foreground">Fabricante</Text>
            <Badge variant="outline">
              <Text className="text-xs">{TRUCK_MANUFACTURER_LABELS[paint.manufacturer]}</Text>
            </Badge>
          </View>
        )}

        {paint.palette && (
          <View className="flex-row items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <Text className="text-sm text-muted-foreground">Paleta de Cor</Text>
            <Badge variant="outline">
              <Text className="text-xs">{COLOR_PALETTE_LABELS[paint.palette]}</Text>
            </Badge>
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
            <View className="flex-row items-start justify-between">
              <Text className="text-sm text-muted-foreground">Tags</Text>
              <View className="flex-row flex-wrap gap-1 justify-end max-w-[60%]">
                {paint.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Text className="text-xs">{tag}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
})
