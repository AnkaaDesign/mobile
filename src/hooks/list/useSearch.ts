import { useState, useCallback } from 'react'

interface UseSearchOptions {
  debounce?: number
  defaultValue?: string
}

export function useSearch(options: UseSearchOptions = {}) {
  const { defaultValue = '' } = options

  const [text, setText] = useState(defaultValue)
  const [displayText, setDisplayText] = useState(defaultValue)

  const onChangeText = useCallback((value: string) => {
    setDisplayText(value)
  }, [])

  const onSearch = useCallback((value: string) => {
    setText(value)
  }, [])

  const onClear = useCallback(() => {
    setText('')
    setDisplayText('')
  }, [])

  return {
    text,
    displayText,
    onChangeText,
    onSearch,
    onClear,
  }
}
