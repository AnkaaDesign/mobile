import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'

interface CellProps {
  width: number
  align?: 'left' | 'center' | 'right'
  children: React.ReactNode
  style?: ViewStyle
}

export const Cell = memo(function Cell({
  width,
  align = 'left',
  children,
  style,
}: CellProps) {
  return (
    <View
      style={[
        styles.cell,
        { width },
        align === 'center' && styles.centerAlign,
        align === 'right' && styles.rightAlign,
        style,
      ]}
    >
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerAlign: {
    alignItems: 'center',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
})
