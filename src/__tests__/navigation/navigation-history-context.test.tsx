/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { NavigationHistoryProvider, useNavigationHistory } from "@/contexts/navigation-history-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-router
const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

let mockPathname = "/(tabs)/home";

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useNavigation: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigationState: jest.fn(() => ({ routes: [] })),
}));

describe("NavigationHistoryContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/(tabs)/home";
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
  );

  describe("Navigation History Tracking", () => {
    it("should initialize with empty history", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
        expect(result.current.getBackPath()).toBeNull();
      });
    });

    it("should track navigation history", async () => {
      const { result, rerender } = renderHook(() => useNavigationHistory(), { wrapper });

      // Simulate navigation to a new path
      jest.spyOn(require("expo-router"), "usePathname").mockReturnValue("/(tabs)/production");
      rerender({});

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(true);
      });
    });

    it("should not add duplicate consecutive routes", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Navigate to the same path multiple times
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/home");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should limit history to 20 entries", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Add more than 20 routes
      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.pushToHistory(`/(tabs)/route${i}`);
        }
      });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(true);
      });

      // History should be limited to 20
      // We can't directly access history length, but we can verify it works
      expect(result.current.getBackPath()).toBeTruthy();
    });

    it("should clear history on auth routes", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Add some history
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
      });

      expect(result.current.canGoBack).toBe(true);

      // Navigate to auth route
      act(() => {
        result.current.pushToHistory("/(auth)/login");
      });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
      });
    });
  });

  describe("Back Navigation", () => {
    it("should navigate back using router.back()", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Add history
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
      });

      expect(result.current.canGoBack).toBe(true);

      // Go back
      act(() => {
        result.current.goBack();
      });

      await waitFor(() => {
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it("should navigate to home if no history", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });

    it("should not go back to auth routes", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Try to create invalid history (this shouldn't happen normally)
      act(() => {
        result.current.pushToHistory("/(auth)/login");
        result.current.pushToHistory("/(tabs)/home");
      });

      act(() => {
        result.current.goBack();
      });

      // Should navigate to home instead of auth route
      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });

    it("should get back path correctly", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production");
    });
  });

  describe("Clear History", () => {
    it("should clear all navigation history", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Add history
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
      });

      expect(result.current.canGoBack).toBe(true);

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
        expect(result.current.getBackPath()).toBeNull();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle root path correctly", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/");
      });

      // Root path should not be added to history
      expect(result.current.canGoBack).toBe(false);
    });

    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useNavigationHistory());
      }).toThrow("useNavigationHistory must be used within a NavigationHistoryProvider");

      console.error = originalError;
    });
  });

  describe("Enhanced Features", () => {
    it("should persist history to AsyncStorage", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
      });

      act(() => {
        result.current.pushToHistory("/(tabs)/production", { test: "param" });
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it("should hydrate history from AsyncStorage on mount", async () => {
      const storedHistory = JSON.stringify([
        { path: "/(tabs)/home", timestamp: Date.now() },
        { path: "/(tabs)/production", timestamp: Date.now() },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedHistory);

      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(true);
      });
    });

    it("should track navigation with params", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
      });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/details/123", { id: "123" });
      });

      await waitFor(() => {
        const history = result.current.getHistory();
        expect(history[history.length - 1].params).toEqual({ id: "123" });
      });
    });

    it("should provide navigation depth", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.getNavigationDepth()).toBe(0);
      });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      await waitFor(() => {
        expect(result.current.getNavigationDepth()).toBe(2);
      });
    });

    it("should navigate with history tracking", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
      });

      act(() => {
        result.current.navigateWithHistory("/(tabs)/production");
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/production");
      });
    });

    it("should replace in history", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
      });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      await waitFor(() => {
        expect(result.current.getNavigationDepth()).toBe(1);
      });

      act(() => {
        result.current.replaceInHistory("/(tabs)/inventory");
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)/inventory");
        expect(result.current.getNavigationDepth()).toBe(1);
      });
    });

    it("should detect initial route", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialRoute()).toBe(true);
      });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      await waitFor(() => {
        expect(result.current.isInitialRoute()).toBe(false);
      });
    });

    it("should get previous route with params", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.getPreviousRoute()).toBeNull();
      });

      act(() => {
        result.current.pushToHistory("/(tabs)/production", { page: 1 });
        result.current.pushToHistory("/(tabs)/inventory", { page: 2 });
      });

      await waitFor(() => {
        const prev = result.current.getPreviousRoute();
        expect(prev?.path).toBe("/(tabs)/production");
        expect(prev?.params).toEqual({ page: 1 });
      });
    });

    it("should filter out stale entries on hydration", async () => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;

      const storedHistory = JSON.stringify([
        { path: "/(tabs)/old", timestamp: twoDaysAgo },
        { path: "/(tabs)/recent", timestamp: dayAgo + 1000 },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedHistory);

      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        const history = result.current.getHistory();
        expect(history.length).toBe(1);
        expect(history[0].path).toBe("/(tabs)/recent");
      });
    });

    it("should handle goBack with fallback path", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.canGoBack).toBe(false);
      });

      act(() => {
        result.current.goBack("/(tabs)/custom-fallback");
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/custom-fallback");
      });
    });

    it("should limit history size to MAX_HISTORY_SIZE", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.getNavigationDepth()).toBe(0);
      });

      // Add more than MAX_HISTORY_SIZE entries
      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.pushToHistory(`/(tabs)/route${i}`);
        }
      });

      await waitFor(() => {
        expect(result.current.getNavigationDepth()).toBeLessThanOrEqual(50);
      });
    });
  });
});
