import React, { useState, useEffect } from 'react'
import { TextInput } from './text-input'

interface CurrencyInputProps {
  value?: number // Value in cents
  onValueChange?: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

/**
 * Currency Input with natural typing
 *
 * As you type numbers, it formats as BRL currency:
 * - Type "4" → "R$ 0,04"
 * - Type "2" → "R$ 0,42"
 * - Type "0" → "R$ 4,20"
 * - Type "0" → "R$ 42,00"
 *
 * Stores value internally as cents (integer)
 */
export function CurrencyInput({
  value,
  onValueChange,
  placeholder = 'R$ 0,00',
  disabled = false,
  error = false,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Format cents to BRL currency string
  const formatCurrency = (cents: number): string => {
    const reais = cents / 100
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Update display when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatCurrency(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChangeText = (text: string) => {
    // Remove all non-numeric characters
    const numericOnly = text.replace(/\D/g, '')

    if (numericOnly === '') {
      setDisplayValue('')
      onValueChange?.(undefined)
      return
    }

    // Parse as integer (cents)
    const cents = parseInt(numericOnly, 10)

    // Format and display
    const formatted = formatCurrency(cents)
    setDisplayValue(formatted)

    // Notify parent with cents value
    onValueChange?.(cents)
  }

  return (
    <TextInput
      value={displayValue}
      onChangeText={handleChangeText}
      placeholder={placeholder}
      keyboardType="numeric"
      disabled={disabled}
      error={error}
    />
  )
}
