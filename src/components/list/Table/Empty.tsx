import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { Icon } from '@/components/ui/icon'

interface EmptyProps {
  icon?: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export const Empty = memo(function Empty({
  icon = 'inbox',
  title = 'Nenhum item encontrado',
  description = 'Tente ajustar os filtros ou adicione novos itens',
  action,
}: EmptyProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <Icon name={icon} size="xl" variant="muted" />
      <ThemedText style={[styles.title, { color: colors.foreground }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
        {description}
      </ThemedText>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: 24,
  },
})
