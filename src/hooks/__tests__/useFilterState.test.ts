/**
 * Tests for useFilterState hook
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFilterState, useFilterStateDebounced } from '../useFilterState';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

interface TestFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  count: number;
}

const defaultFilters: TestFilters = {
  search: '',
  status: 'all',
  count: 0,
};

describe('useFilterState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('initializes with default filters', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filters).toEqual(defaultFilters);
  });

  it('loads filters from AsyncStorage', async () => {
    const storedFilters = {
      search: 'test query',
      status: 'active' as const,
      count: 5,
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedFilters));

    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filters).toEqual(storedFilters);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@filters_test');
  });

  it('saves filters to AsyncStorage when updated', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateFilters({ search: 'new query' });
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@filters_test',
        JSON.stringify({ ...defaultFilters, search: 'new query' })
      );
    });
  });

  it('updates filters correctly', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateFilters({ search: 'test', count: 10 });
    });

    expect(result.current.filters).toEqual({
      search: 'test',
      status: 'all',
      count: 10,
    });
  });

  it('resets filters to default', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateFilters({ search: 'test', status: 'active', count: 5 });
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual(defaultFilters);
  });

  it('clears single filter', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateFilters({ search: 'test', status: 'active', count: 5 });
    });

    act(() => {
      result.current.clearFilter('search');
    });

    expect(result.current.filters).toEqual({
      search: '',
      status: 'active',
      count: 5,
    });
  });

  it('sets filters using function updater', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilters((prev) => ({
        ...prev,
        count: prev.count + 1,
      }));
    });

    expect(result.current.filters.count).toBe(1);
  });

  it('detects active filters - primitives', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('detects active filters - arrays', async () => {
    const defaultWithArray = {
      tags: [] as string[],
    };

    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters: defaultWithArray,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilters({ tags: ['tag1'] });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('detects active filters - objects', async () => {
    const defaultWithObject = {
      range: { min: 0, max: 100 },
    };

    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters: defaultWithObject,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilters({ range: { min: 10, max: 100 } });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('calls onChange callback when filters change', async () => {
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
        onChange,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'test',
      });
    });
  });

  it('does not save to storage during initial load', async () => {
    const { result } = renderHook(() =>
      useFilterState({
        key: 'test',
        defaultFilters,
      })
    );

    // Should load from storage
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@filters_test');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not save during initial load
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('useFilterStateDebounced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces AsyncStorage writes', async () => {
    const { result } = renderHook(() =>
      useFilterStateDebounced(
        {
          key: 'test',
          defaultFilters,
        },
        300
      )
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Rapid updates
    act(() => {
      result.current.updateFilters({ search: 't' });
    });
    act(() => {
      result.current.updateFilters({ search: 'te' });
    });
    act(() => {
      result.current.updateFilters({ search: 'tes' });
    });
    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    // Should not have saved yet (debounced)
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    // Fast-forward debounce delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should have saved only once
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@filters_test',
      JSON.stringify({ ...defaultFilters, search: 'test' })
    );
  });

  it('resets debounce timer on new updates', async () => {
    const { result } = renderHook(() =>
      useFilterStateDebounced(
        {
          key: 'test',
          defaultFilters,
        },
        500
      )
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    // Advance 400ms (before debounce completes)
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // New update resets timer
    act(() => {
      result.current.updateFilters({ search: 'test2' });
    });

    // Advance another 400ms
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Still not saved (timer was reset)
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    // Advance final 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Now should be saved
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });
});
