import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for debounced search input
 *
 * This hook separates display value (what user types) from search value (what triggers API calls)
 * with a configurable debounce delay. This prevents excessive API calls while typing.
 *
 * @param initialValue - Initial search text
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with displayText, searchText, and setDisplayText
 *
 * @example
 * ```tsx
 * const { displayText, searchText, setDisplayText } = useDebouncedSearch("", 300);
 *
 * // In your component:
 * <SearchBar value={displayText} onChangeText={setDisplayText} />
 *
 * // In your query:
 * const queryParams = {
 *   ...(searchText ? { searchingFor: searchText } : {}),
 * };
 * ```
 */
export function useDebouncedSearch(initialValue = "", debounceMs = 300) {
  const [displayText, setDisplayText] = useState(initialValue);
  const [searchText, setSearchText] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchText(displayText);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [displayText, debounceMs]);

  // Reset function (useful for clearing search)
  const reset = useCallback(() => {
    setDisplayText("");
    setSearchText("");
  }, []);

  return {
    /** The current display value (what user types) */
    displayText,
    /** The debounced search value (use this for API calls) */
    searchText,
    /** Update the display text (triggers debounced update of searchText) */
    setDisplayText,
    /** Reset both displayText and searchText to empty */
    reset,
  };
}

/**
 * Alternative hook with more control over debounce behavior
 *
 * @param initialValue - Initial search text
 * @param options - Configuration options
 * @returns Object with state and control functions
 *
 * @example
 * ```tsx
 * const search = useAdvancedDebouncedSearch("", {
 *   debounceMs: 500,
 *   minLength: 3, // Only search if >= 3 characters
 *   onSearchChange: (text) => console.log("Searching for:", text)
 * });
 *
 * <SearchBar
 *   value={search.displayText}
 *   onChangeText={search.setDisplayText}
 *   onClear={search.reset}
 * />
 * ```
 */
export function useAdvancedDebouncedSearch(
  initialValue = "",
  options: {
    debounceMs?: number;
    minLength?: number;
    onSearchChange?: (searchText: string) => void;
  } = {}
) {
  const { debounceMs = 300, minLength = 0, onSearchChange } = options;

  const [displayText, setDisplayText] = useState(initialValue);
  const [searchText, setSearchText] = useState(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const handler = setTimeout(() => {
      const trimmedText = displayText.trim();

      // Only update search text if it meets minimum length requirement
      if (trimmedText.length === 0 || trimmedText.length >= minLength) {
        setSearchText(trimmedText);
        onSearchChange?.(trimmedText);
      }

      setIsDebouncing(false);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
      setIsDebouncing(false);
    };
  }, [displayText, debounceMs, minLength, onSearchChange]);

  const reset = useCallback(() => {
    setDisplayText("");
    setSearchText("");
  }, []);

  const setSearchImmediately = useCallback((text: string) => {
    setDisplayText(text);
    setSearchText(text);
  }, []);

  return {
    displayText,
    searchText,
    setDisplayText,
    setSearchImmediately,
    reset,
    isDebouncing,
    hasMinLength: displayText.length >= minLength,
  };
}

/**
 * Hook for debouncing any value (not just search)
 *
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [filterValue, setFilterValue] = useState("");
 * const debouncedFilter = useDebounce(filterValue, 300);
 *
 * // debouncedFilter updates 300ms after filterValue stops changing
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
