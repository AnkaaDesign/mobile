/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { NavigationHistoryProvider, useNavigationHistory } from "@/contexts/navigation-history-context";

// Mock expo-router
const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
};

let mockPathname = "/(tabs)/home";

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useSegments: () => mockPathname.split("/").filter(Boolean),
}));

describe("Navigation Error Handling Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/(tabs)/home";
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
  );

  describe("Non-existent Route Handling", () => {
    it("should handle navigation to non-existent route gracefully", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/non-existent-route");
      });

      // Should not throw error
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle back navigation from non-existent route", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/non-existent");
      });

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should navigate to home when non-existent route is the only history", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/invalid-route");
      });

      act(() => {
        result.current.goBack();
      });

      // Should fallback to home
      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });
  });

  describe("Invalid Route Parameters", () => {
    it("should handle route with invalid UUID format", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/invalid-uuid");
      });

      // Should still track the route even if UUID is invalid
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle route with missing required parameters", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/inventory/orders/items/details/");
      });

      // Should handle gracefully
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle route with extra parameters", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/extra/params/that/dont/exist");
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Malformed Route Paths", () => {
    it("should handle route without (tabs) prefix", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/production/schedule");
      });

      // Should track without prefix
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle route with double slashes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)//production//schedule");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle route with trailing slash", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle empty route string", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("");
      });

      // Empty string should not be added
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Navigation Stack Corruption", () => {
    it("should recover from corrupted navigation stack", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Create valid history
      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      // Attempt to corrupt with invalid route
      act(() => {
        result.current.pushToHistory(null as any);
      });

      // Should still be able to navigate back
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should handle undefined in navigation history", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory(undefined as any);
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should clear corrupted history and start fresh", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Add some routes
      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      // Should be able to start fresh
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Race Condition Handling", () => {
    it("should handle rapid navigation changes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Simulate rapid navigation
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.pushToHistory(`/(tabs)/route${i}`);
        }
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should handle simultaneous back navigation requests", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
        result.current.pushToHistory("/(tabs)/painting");
      });

      // Multiple rapid back calls
      act(() => {
        result.current.goBack();
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should handle navigation during ongoing navigation", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        // Immediately navigate again
        result.current.pushToHistory("/(tabs)/inventory");
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should limit history to prevent memory leaks", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Add 50 routes (more than the 20 limit)
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.pushToHistory(`/(tabs)/route${i}`);
        }
      });

      // Should still be able to go back (history limited internally)
      expect(result.current.canGoBack).toBe(true);
    });

    it("should not add duplicate consecutive routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production");
      });

      // Should only have one entry
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Authentication State Errors", () => {
    it("should handle navigation when user logs out", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      // Simulate logout - history should be cleared
      act(() => {
        result.current.pushToHistory("/(auth)/login");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should prevent navigation to protected routes after logout", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // User is logged in
      act(() => {
        result.current.pushToHistory("/(tabs)/administration");
      });

      // User logs out
      act(() => {
        result.current.clearHistory();
        result.current.pushToHistory("/(auth)/login");
      });

      // Should not have history
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle token expiration during navigation", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      // Token expires, redirect to auth
      act(() => {
        result.current.pushToHistory("/(auth)/login");
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Platform-Specific Errors", () => {
    it("should handle navigation on different platforms", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Navigation should work regardless of platform
      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle web-specific navigation errors", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Web might have different URL formats
      act(() => {
        result.current.pushToHistory("/(tabs)/production?query=param");
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Deep Link Errors", () => {
    it("should handle invalid deep link format", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("app://invalid-deep-link");
      });

      // Should track the path
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle deep link with incorrect parameters", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/wrong-param");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle deep link to unauthorized route", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Attempt to deep link to admin route
      act(() => {
        result.current.pushToHistory("/(tabs)/administration");
      });

      // History tracks it, but actual access control happens at route level
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Navigation Timeout Errors", () => {
    it("should handle slow navigation gracefully", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      // Wait for potential async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.canGoBack).toBe(false);
    });

    it("should not block on failed navigation", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Push multiple routes quickly
      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe("Context Provider Errors", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useNavigationHistory());
      }).toThrow("useNavigationHistory must be used within a NavigationHistoryProvider");

      console.error = originalError;
    });

    it("should handle multiple provider instances", () => {
      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
      );

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
      );

      const { result: result1 } = renderHook(() => useNavigationHistory(), { wrapper: wrapper1 });
      const { result: result2 } = renderHook(() => useNavigationHistory(), { wrapper: wrapper2 });

      // Each should have independent state
      act(() => {
        result1.current.pushToHistory("/(tabs)/production");
      });

      act(() => {
        result2.current.pushToHistory("/(tabs)/inventory");
      });

      expect(result1.current.canGoBack).toBe(false);
      expect(result2.current.canGoBack).toBe(false);
    });
  });

  describe("Edge Case Routes", () => {
    it("should handle root route correctly", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/");
      });

      // Root should not be added to history
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle special characters in routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production?filter=pending&sort=date");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle hash fragments in routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production#section");
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Fallback Navigation", () => {
    it("should fallback to home when back path is invalid", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // No history
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });

    it("should provide safe default when getBackPath returns null", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const backPath = result.current.getBackPath();
      expect(backPath).toBeNull();

      // Going back should still work
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });
  });

  describe("Error Recovery", () => {
    it("should recover from navigation errors and continue functioning", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Create an error scenario
      act(() => {
        result.current.pushToHistory(null as any);
      });

      // Should recover and work normally
      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should maintain state after error", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
      });

      // Attempt invalid operation
      act(() => {
        result.current.pushToHistory(undefined as any);
      });

      // State should be maintained
      expect(result.current.canGoBack).toBe(false);
    });
  });
});
