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

describe("Back Button Functionality Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/(tabs)/home";
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
  );

  describe("Basic Back Navigation", () => {
    it("should go back to previous route when history exists", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Simulate navigation history
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production/schedule");
      });

      expect(result.current.canGoBack).toBe(true);

      // Go back
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });

    it("should navigate to home when no history exists", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      expect(result.current.canGoBack).toBe(false);

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });

    it("should not show back button on home screen", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Only on home
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Back Navigation from Different Screens", () => {
    it("should go back from production schedule to production", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production/schedule");
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production");

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should go back from details page to list page", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/inventory/products/list");
        result.current.pushToHistory("/(tabs)/inventory/products/details/123");
      });

      expect(result.current.canGoBack).toBe(true);

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should go back from edit page to details page", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/inventory/products/details/123");
        result.current.pushToHistory("/(tabs)/inventory/products/edit/123");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/inventory/products/details/123");
    });
  });

  describe("Back Button Edge Cases", () => {
    it("should not go back to auth routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Simulate coming from auth (shouldn't happen in real app)
      act(() => {
        result.current.pushToHistory("/(auth)/login");
        result.current.pushToHistory("/(tabs)/home");
      });

      // History should be cleared on auth route
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle deep navigation stacks correctly", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Create deep navigation
      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production/schedule");
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/details/123");
      });

      expect(result.current.canGoBack).toBe(true);

      // Go back multiple times
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
      expect(result.current.canGoBack).toBe(true);
    });

    it("should handle back navigation from nested routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/inventory");
        result.current.pushToHistory("/(tabs)/inventory/products");
        result.current.pushToHistory("/(tabs)/inventory/products/categories");
        result.current.pushToHistory("/(tabs)/inventory/products/categories/details/456");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/inventory/products/categories");
    });
  });

  describe("Back Button with Parameters", () => {
    it("should preserve route parameters when going back", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const uuid = "550e8400-e29b-41d4-a716-446655440000";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${uuid}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${uuid}`);
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toContain(uuid);
      expect(backPath).toContain("details");
    });

    it("should handle back navigation with multiple parameters", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const orderId = "order-123";
      const itemId = "item-456";

      act(() => {
        result.current.pushToHistory(`/(tabs)/inventory/orders/${orderId}/items`);
        result.current.pushToHistory(`/(tabs)/inventory/orders/${orderId}/items/details/${itemId}`);
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toContain(orderId);
      expect(backPath).toContain("items");
    });
  });

  describe("Back Button State Management", () => {
    it("should update canGoBack correctly after navigation", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      expect(result.current.canGoBack).toBe(false);

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
      });

      expect(result.current.canGoBack).toBe(true);

      act(() => {
        result.current.goBack();
      });

      // After going back, should still be able to go back if history exists
      // This depends on the implementation
    });

    it("should handle rapid back button presses", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
      });

      // Simulate rapid presses
      act(() => {
        result.current.goBack();
        result.current.goBack();
      });

      // Should have called back twice
      expect(mockRouter.back).toHaveBeenCalledTimes(2);
    });
  });

  describe("Back Button from Special Routes", () => {
    it("should handle back from personal routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/personal");
        result.current.pushToHistory("/(tabs)/personal/my-profile");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/personal");
    });

    it("should handle back from settings/preferences", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/personal");
        result.current.pushToHistory("/(tabs)/personal/preferences");
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should handle back from modal-like routes", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/inventory/products/list");
        result.current.pushToHistory("/(tabs)/inventory/products/create");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/inventory/products/list");
    });
  });

  describe("Cross-Module Navigation", () => {
    it("should handle back navigation across different modules", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/inventory");
        result.current.pushToHistory("/(tabs)/painting");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/inventory");
    });

    it("should handle back to home from any module", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production/schedule/details/123");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/home");
    });
  });

  describe("Back Button Behavior Validation", () => {
    it("should not allow back navigation on login screen", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(auth)/login");
      });

      // Auth routes clear history
      expect(result.current.canGoBack).toBe(false);
    });

    it("should clear history after logout", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
      });

      expect(result.current.canGoBack).toBe(true);

      // Clear history (simulating logout)
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });
});
