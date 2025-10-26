import { useEffect, useState } from "react";

/**
 * Hook that returns a debounced value
 *
 * Similar to useDebounce but with a clearer name that indicates
 * it returns a debounced value rather than debouncing a function.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
 *
 * // Use debouncedSearchTerm in your query
 * const { data } = useQuery({
 *   queryKey: ['search', debouncedSearchTerm],
 *   queryFn: () => searchAPI(debouncedSearchTerm),
 * });
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
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
