import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Returns a key that forces form component remount when the screen regains focus.
 *
 * Use this in CREATE form screens to ensure the form resets when the user
 * navigates back to the screen after a previous save/cancel.
 *
 * The first focus (initial mount) is skipped to avoid an unnecessary remount.
 * On subsequent focuses, the key changes, causing React to unmount and remount
 * any component using this key — giving a clean form state.
 *
 * For EDIT screens, use `key={id}` directly on the form component instead.
 */
export function useFormScreenKey(): string {
  const [key, setKey] = useState(0);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      setKey(prev => prev + 1);
    }, [])
  );

  return String(key);
}
