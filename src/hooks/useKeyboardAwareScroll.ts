import { useRef, useState, useEffect, useCallback } from 'react'
import { Keyboard, Platform, Dimensions, LayoutChangeEvent, ScrollView } from 'react-native'

const SCREEN_HEIGHT = Dimensions.get('window').height

// Extra padding to account for keyboard suggestions/autocomplete bar
// iOS QuickType bar is typically ~44px, Android varies
const KEYBOARD_SUGGESTIONS_HEIGHT = 50

export interface KeyboardAwareScrollState {
  keyboardHeight: number
  focusedFieldKey: string | null
  comboboxExtraPadding: number
}

export interface KeyboardAwareScrollHandlers {
  handleFieldLayout: (fieldKey: string, event: LayoutChangeEvent) => void
  handleFieldFocus: (fieldKey: string) => void
  handleComboboxOpen: (measurements: { inputY: number; inputHeight: number; requiredHeight: number }) => boolean
  handleComboboxClose: () => void
  handleScrollViewLayout: (event: LayoutChangeEvent) => void
  handleScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => void
}

export interface KeyboardAwareScrollRefs {
  scrollViewRef: React.RefObject<ScrollView | null>
  fieldLayoutsRef: React.MutableRefObject<Map<string, { y: number; height: number }>>
  scrollViewYRef: React.MutableRefObject<number>
  currentScrollY: React.MutableRefObject<number>
}

export interface UseKeyboardAwareScrollReturn {
  state: KeyboardAwareScrollState
  handlers: KeyboardAwareScrollHandlers
  refs: KeyboardAwareScrollRefs
  getContentPadding: (basePadding: number) => number
}

/**
 * Hook that provides intelligent keyboard-aware scrolling for forms.
 *
 * Features:
 * - Tracks keyboard height via platform-specific events
 * - Tracks field positions via onLayout callbacks
 * - Automatically scrolls focused fields into view above keyboard
 * - Handles combobox opening with scroll-to-top positioning
 * - Provides dynamic padding for content
 *
 * Usage:
 * ```tsx
 * const { state, handlers, refs, getContentPadding } = useKeyboardAwareScroll()
 *
 * <ScrollView
 *   ref={refs.scrollViewRef}
 *   onLayout={handlers.handleScrollViewLayout}
 *   onScroll={handlers.handleScroll}
 *   scrollEventThrottle={16}
 *   contentContainerStyle={{ paddingBottom: getContentPadding(16) }}
 * >
 *   <View onLayout={(e) => handlers.handleFieldLayout('fieldKey', e)}>
 *     <Input onFocus={() => handlers.handleFieldFocus('fieldKey')} />
 *   </View>
 *   <Combobox
 *     onOpen={handlers.handleComboboxOpen}
 *     onClose={handlers.handleComboboxClose}
 *   />
 * </ScrollView>
 * ```
 */
export function useKeyboardAwareScroll(): UseKeyboardAwareScrollReturn {
  const scrollViewRef = useRef<ScrollView>(null)
  const fieldLayoutsRef = useRef<Map<string, { y: number; height: number }>>(new Map())
  const scrollViewYRef = useRef(0)
  const currentScrollY = useRef(0)

  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null)
  const [comboboxExtraPadding, setComboboxExtraPadding] = useState(0)

  // Store pending scroll info when focus happens before keyboard shows
  const pendingScrollRef = useRef<{ fieldKey: string; screenY: number; height: number } | null>(null)

  // Perform the actual scroll calculation and execution
  const performScroll = useCallback((screenY: number, height: number, kbHeight: number) => {
    if (!scrollViewRef.current || kbHeight === 0) return

    // Field bottom position on screen
    const fieldBottomOnScreen = screenY + height

    // Calculate the visible area bottom (above keyboard + suggestions bar)
    const totalKeyboardHeight = kbHeight + KEYBOARD_SUGGESTIONS_HEIGHT
    const visibleAreaBottom = SCREEN_HEIGHT - totalKeyboardHeight

    // Only scroll if the field's bottom is hidden by keyboard
    if (fieldBottomOnScreen > visibleAreaBottom) {
      // Calculate how much to scroll - just enough to show the field
      const hiddenAmount = fieldBottomOnScreen - visibleAreaBottom

      // Minimal padding (8px) to just clear the keyboard
      const targetScrollY = currentScrollY.current + hiddenAmount + 8

      scrollViewRef.current.scrollTo({
        y: targetScrollY,
        animated: true,
      })
    }
  }, [])

  // When keyboard height changes and we have a pending scroll, execute it
  useEffect(() => {
    if (keyboardHeight > 0 && pendingScrollRef.current) {
      const { screenY, height } = pendingScrollRef.current
      performScroll(screenY, height, keyboardHeight)
      pendingScrollRef.current = null
    }
  }, [keyboardHeight, performScroll])

  // Track keyboard visibility
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })

    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
      setFocusedFieldKey(null)
    })

    return () => {
      showListener.remove()
      hideListener.remove()
    }
  }, [])

  // Store refs to field views for measuring on focus
  const fieldViewRefs = useRef<Map<string, any>>(new Map())

  // Handle field layout measurement - store the view ref for later measurement
  const handleFieldLayout = useCallback((fieldKey: string, event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    const target = event.target

    // Store height and view reference
    fieldLayoutsRef.current.set(fieldKey, { y: 0, height })
    if (target) {
      fieldViewRefs.current.set(fieldKey, target)
    }
  }, [])

  // Handle field focus - measure position now and scroll
  const handleFieldFocus = useCallback((fieldKey: string) => {
    const viewRef = fieldViewRefs.current.get(fieldKey)
    const layoutInfo = fieldLayoutsRef.current.get(fieldKey)

    setFocusedFieldKey(fieldKey)

    if (viewRef && layoutInfo) {
      // Measure current position on screen
      (viewRef as any).measureInWindow?.((_x: number, screenY: number) => {
        // If keyboard is already visible, scroll immediately
        if (keyboardHeight > 0) {
          performScroll(screenY, layoutInfo.height, keyboardHeight)
        } else {
          // Store for when keyboard appears
          pendingScrollRef.current = { fieldKey, screenY, height: layoutInfo.height }
        }
      })
    }
  }, [keyboardHeight, performScroll])

  // Handle combobox opening - scroll to position trigger near top of screen
  // This gives maximum space for the dropdown below
  // Returns true if scrolling was needed
  const handleComboboxOpen = useCallback((measurements: { inputY: number; inputHeight: number; requiredHeight: number }): boolean => {
    if (!scrollViewRef.current) return false

    const { inputY, inputHeight } = measurements

    // Target position: place input with comfortable margin from top
    const targetTopMargin = 140 // Distance from top of screen where input should be

    // Only scroll if input is below the target position
    if (inputY > targetTopMargin + 20) {
      // Calculate how much to scroll to bring input to target position
      const scrollNeeded = inputY - targetTopMargin

      // Add extra padding to allow scroll room
      setComboboxExtraPadding(scrollNeeded + 200)

      // Then scroll after a brief delay to let padding apply
      setTimeout(() => {
        const targetScrollY = currentScrollY.current + scrollNeeded
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, targetScrollY),
          animated: true,
        })
      }, 50)
      return true
    }
    return false
  }, [])

  // Function to reset padding when combobox closes
  const handleComboboxClose = useCallback(() => {
    setComboboxExtraPadding(0)
  }, [])

  // Handle ScrollView layout measurement
  const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    // Use measureInWindow via target if available
    const target = event.target as any
    if (target?.measureInWindow) {
      target.measureInWindow((_x: number, y: number) => {
        scrollViewYRef.current = y
      })
    }
  }, [])

  // Handle scroll position tracking
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    currentScrollY.current = event.nativeEvent.contentOffset.y
  }, [])

  // Calculate content padding based on keyboard state
  const getContentPadding = useCallback((basePadding: number) => {
    // When combobox is open, add its extra padding
    if (comboboxExtraPadding > 0) {
      return basePadding + comboboxExtraPadding
    }
    // When keyboard is open, add small buffer for scrolling
    if (keyboardHeight > 0) {
      return basePadding + 50
    }
    // Default: just base padding
    return basePadding
  }, [keyboardHeight, comboboxExtraPadding])

  return {
    state: {
      keyboardHeight,
      focusedFieldKey,
      comboboxExtraPadding,
    },
    handlers: {
      handleFieldLayout,
      handleFieldFocus,
      handleComboboxOpen,
      handleComboboxClose,
      handleScrollViewLayout,
      handleScroll,
    },
    refs: {
      scrollViewRef,
      fieldLayoutsRef,
      scrollViewYRef,
      currentScrollY,
    },
    getContentPadding,
  }
}

export default useKeyboardAwareScroll
