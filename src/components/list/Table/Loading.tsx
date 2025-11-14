import { memo } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'

interface LoadingProps {
  type?: 'skeleton' | 'footer' | 'overlay'
}

export const Loading = memo(function Loading({ type = 'skeleton' }: LoadingProps) {
  const { colors } = useTheme()

  if (type === 'footer') {
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={[styles.footerText, { color: colors.mutedForeground }]}>
          Carregando mais...
        </ThemedText>
      </View>
    )
  }

  if (type === 'overlay') {
    return (
      <View style={[styles.overlay, { backgroundColor: colors.background + 'CC' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // Skeleton loading
  return (
    <View style={styles.skeleton}>
      {[...Array(10)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonRow,
            { backgroundColor: index % 2 === 0 ? colors.card : colors.background },
          ]}
        >
          <View style={[styles.skeletonCell, styles.skeletonShimmer, { backgroundColor: colors.muted }]} />
          <View style={[styles.skeletonCell, styles.skeletonShimmer, { backgroundColor: colors.muted }]} />
          <View style={[styles.skeletonCell, styles.skeletonShimmer, { backgroundColor: colors.muted }]} />
        </View>
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  skeleton: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  skeletonCell: {
    flex: 1,
    height: 24,
    borderRadius: 4,
  },
  skeletonShimmer: {
    opacity: 0.6,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
})
