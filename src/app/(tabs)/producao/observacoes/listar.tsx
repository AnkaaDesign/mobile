import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { observationsListConfig } from '@/config/list/production/observations'

export default function ObservationListScreen() {
  return (
    <View style={styles.flex}>
      <Layout config={observationsListConfig} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})
