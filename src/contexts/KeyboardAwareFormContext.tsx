import React, { createContext, useContext } from 'react'
import { LayoutChangeEvent } from 'react-native'

export interface KeyboardAwareFormContextType {
  /** Register a field's layout for scroll tracking */
  onFieldLayout: (fieldKey: string, event: LayoutChangeEvent) => void
  /** Called when a field receives focus */
  onFieldFocus: (fieldKey: string) => void
  /** Called when a combobox opens - returns true if scroll was performed */
  onComboboxOpen: (measurements: { inputY: number; inputHeight: number; requiredHeight: number }) => boolean
  /** Called when a combobox closes */
  onComboboxClose: () => void
}

const KeyboardAwareFormContext = createContext<KeyboardAwareFormContextType | null>(null)

export interface KeyboardAwareFormProviderProps {
  children: React.ReactNode
  value: KeyboardAwareFormContextType
}

export function KeyboardAwareFormProvider({ children, value }: KeyboardAwareFormProviderProps) {
  return (
    <KeyboardAwareFormContext.Provider value={value}>
      {children}
    </KeyboardAwareFormContext.Provider>
  )
}

/**
 * Hook to access keyboard-aware form handlers.
 * Use this in form field components to integrate with the intelligent keyboard handling.
 *
 * Returns null if not within a KeyboardAwareFormProvider (for backwards compatibility).
 *
 * Usage in a form field:
 * ```tsx
 * function MyFormField({ name, ...props }) {
 *   const keyboardContext = useKeyboardAwareForm()
 *
 *   return (
 *     <View onLayout={keyboardContext ? (e) => keyboardContext.onFieldLayout(name, e) : undefined}>
 *       <Input
 *         onFocus={() => keyboardContext?.onFieldFocus(name)}
 *         {...props}
 *       />
 *     </View>
 *   )
 * }
 * ```
 */
export function useKeyboardAwareForm(): KeyboardAwareFormContextType | null {
  return useContext(KeyboardAwareFormContext)
}

/**
 * Hook to access keyboard-aware form handlers.
 * Throws an error if not within a KeyboardAwareFormProvider.
 *
 * Use this when you require keyboard-aware handling.
 */
export function useRequiredKeyboardAwareForm(): KeyboardAwareFormContextType {
  const context = useContext(KeyboardAwareFormContext)
  if (!context) {
    throw new Error('useRequiredKeyboardAwareForm must be used within a KeyboardAwareFormProvider')
  }
  return context
}

export default KeyboardAwareFormContext
