import React, { useState, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'

interface DeadlineCountdownProps {
  deadline: string | null
  showForStatuses?: string[]
  currentStatus?: string
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})

export function DeadlineCountdown({ deadline, showForStatuses, currentStatus }: DeadlineCountdownProps) {
  const { colors } = useTheme()
  const [countdown, setCountdown] = useState<{ text: string; isOverdue: boolean } | null>(null)

  useEffect(() => {
    if (!deadline) {
      setCountdown(null)
      return
    }

    // Check if we should show for this status
    if (showForStatuses && currentStatus && !showForStatuses.includes(currentStatus)) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const deadlineDate = new Date(deadline)
      const diffMs = deadlineDate.getTime() - now.getTime()
      const isOverdue = diffMs < 0

      const totalSeconds = Math.floor(Math.abs(diffMs) / 1000)
      const days = Math.floor(totalSeconds / (24 * 60 * 60))
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
      const seconds = totalSeconds % 60

      const pad = (n: number) => n.toString().padStart(2, '0')

      setCountdown({
        text: `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
        isOverdue,
      })
    }

    // Initial update
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [deadline, showForStatuses, currentStatus])

  if (!countdown) {
    return <ThemedText style={styles.text}>-</ThemedText>
  }

  return (
    <ThemedText style={[styles.text, { color: colors.foreground }]}>
      {countdown.text}
    </ThemedText>
  )
}
