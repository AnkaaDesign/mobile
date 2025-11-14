import React, { memo } from 'react'
import { View, StyleSheet } from 'react-native'

interface HeaderProps {
  children: React.ReactNode
}

export const Header = memo(function Header({ children }: HeaderProps) {
  return <View style={styles.header}>{children}</View>
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
})
