import React, { memo } from 'react'
import { StyleSheet } from 'react-native'
import { ThemedView } from '@/components/ui/themed-view'

export const Container = memo(function Container({ children }: { children: React.ReactNode }) {
  return <ThemedView style={styles.container}>{children}</ThemedView>
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
