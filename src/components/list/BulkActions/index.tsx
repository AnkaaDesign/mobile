import { memo, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import { IconX } from '@tabler/icons-react-native'
import type { BulkActionsProps } from '../types'

export const BulkActions = memo(function BulkActions({
  selectedIds,
  actions,
  mutations,
  onClear,
}: BulkActionsProps) {
  const { colors } = useTheme()
  const [isExecuting, setIsExecuting] = useState(false)

  const handleAction = async (action: typeof actions[0]) => {
    if (action.confirm) {
      const message = typeof action.confirm.message === 'function'
        ? action.confirm.message(selectedIds.size)
        : action.confirm.message

      Alert.alert(
        action.confirm.title,
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            style: action.variant === 'destructive' ? 'destructive' : 'default',
            onPress: async () => {
              setIsExecuting(true)
              try {
                await action.onPress(selectedIds, mutations)
                onClear()
              } catch (error) {
                console.error('Bulk action error:', error)
                Alert.alert('Erro', 'Falha ao executar ação')
              } finally {
                setIsExecuting(false)
              }
            },
          },
        ]
      )
    } else {
      setIsExecuting(true)
      try {
        await action.onPress(selectedIds, mutations)
        onClear()
      } catch (error) {
        console.error('Bulk action error:', error)
        Alert.alert('Erro', 'Falha ao executar ação')
      } finally {
        setIsExecuting(false)
      }
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary + '10',
          borderBottomColor: colors.primary + '30',
        },
      ]}
    >
      <View style={styles.info}>
        <ThemedText style={[styles.count, { color: colors.primary }]}>
          {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant || 'default'}
            size="sm"
            onPress={() => handleAction(action)}
            disabled={isExecuting}
          >
            {action.label}
          </Button>
        ))}

        <TouchableOpacity
          onPress={onClear}
          style={styles.closeButton}
          disabled={isExecuting}
        >
          <IconX size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  info: {
    flex: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
})
