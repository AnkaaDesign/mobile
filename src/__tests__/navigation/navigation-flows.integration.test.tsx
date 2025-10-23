/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { NavigationHistoryProvider, useNavigationHistory } from "@/contexts/navigation-history-context";
import { getFilteredMenuForUser } from "@/utils/navigation";
import { MENU_ITEMS } from "@/constants/navigation";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { routes } from "@/constants/routes";
import { routeToMobilePath, getEnglishPath } from "@/lib/route-mapper";

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

describe("Navigation Flows Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/(tabs)/home";
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
  );

  describe("Production Module Navigation Flow", () => {
    it("should navigate through production schedule flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Home → Production → Schedule → Details
      const flow = [
        "/(tabs)/home",
        "/(tabs)/production",
        "/(tabs)/production/schedule",
        "/(tabs)/production/schedule/list",
        "/(tabs)/production/schedule/details/123",
      ];

      for (const path of flow) {
        act(() => {
          result.current.pushToHistory(path);
        });
      }

      expect(result.current.canGoBack).toBe(true);

      // Verify we can navigate back through the flow
      for (let i = 0; i < flow.length - 1; i++) {
        act(() => {
          result.current.goBack();
        });
        expect(mockRouter.back).toHaveBeenCalled();
      }
    });

    it("should navigate from schedule list to create new task", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/create");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production/schedule/list");
    });

    it("should navigate from details to edit", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const taskId = "task-123";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${taskId}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${taskId}`);
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toContain("details");
      expect(backPath).toContain(taskId);
    });
  });

  describe("Inventory Module Navigation Flow", () => {
    it("should navigate through product management flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const flow = [
        "/(tabs)/home",
        "/(tabs)/inventory",
        "/(tabs)/inventory/products",
        "/(tabs)/inventory/products/list",
        "/(tabs)/inventory/products/details/prod-456",
      ];

      for (const path of flow) {
        act(() => {
          result.current.pushToHistory(path);
        });
      }

      expect(result.current.canGoBack).toBe(true);
    });

    it("should navigate through order creation flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/inventory/orders/list");
        result.current.pushToHistory("/(tabs)/inventory/orders/create");
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should navigate through order items flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const orderId = "order-789";

      act(() => {
        result.current.pushToHistory(`/(tabs)/inventory/orders/details/${orderId}`);
        result.current.pushToHistory(`/(tabs)/inventory/orders/${orderId}/items`);
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toContain(orderId);
      expect(backPath).toContain("details");
    });
  });

  describe("Personal Section Navigation Flow", () => {
    it("should navigate through personal profile flow", async () => {
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

    it("should navigate to preferences and back", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/personal/my-profile");
        result.current.pushToHistory("/(tabs)/personal/preferences");
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should navigate through notifications flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const notifId = "notif-123";

      act(() => {
        result.current.pushToHistory("/(tabs)/personal/my-notifications");
        result.current.pushToHistory(`/(tabs)/personal/my-notifications/details/${notifId}`);
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/personal/my-notifications");
    });
  });

  describe("Cross-Module Navigation Flow", () => {
    it("should navigate between different modules", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule");
        result.current.pushToHistory("/(tabs)/inventory/products");
        result.current.pushToHistory("/(tabs)/painting/catalog");
      });

      expect(result.current.canGoBack).toBe(true);

      // Go back to inventory
      act(() => {
        result.current.goBack();
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/inventory/products");
    });

    it("should navigate from home to any module and back", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production/schedule");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/home");
    });
  });

  describe("Menu-based Navigation", () => {
    it("should provide navigation paths for all menu items", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.ADMIN,
        },
      };

      const filteredMenu = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      filteredMenu.forEach((item) => {
        if (item.path) {
          const mobilePath = routeToMobilePath(item.path);
          expect(mobilePath).toBeDefined();
          expect(mobilePath).toMatch(/^\(tabs\)|^\(auth\)/);
        }
      });
    });

    it("should navigate through nested menu items", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.WAREHOUSE,
        },
      };

      const filteredMenu = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const inventoryMenu = filteredMenu.find((item) => item.id === "estoque");

      expect(inventoryMenu).toBeDefined();
      expect(inventoryMenu?.children).toBeDefined();

      if (inventoryMenu?.children) {
        inventoryMenu.children.forEach((child) => {
          if (child.path && !child.isDynamic) {
            const mobilePath = routeToMobilePath(child.path);
            expect(mobilePath).toContain("inventory");
          }
        });
      }
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should handle login flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Navigate to login
      act(() => {
        result.current.pushToHistory("/(auth)/login");
      });

      // History should be cleared on auth routes
      expect(result.current.canGoBack).toBe(false);
    });

    it("should navigate to home after login", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Simulate post-login navigation
      act(() => {
        result.current.clearHistory();
        result.current.pushToHistory("/(tabs)/home");
      });

      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle password recovery flow", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(auth)/login");
        result.current.pushToHistory("/(auth)/recover-password");
        result.current.pushToHistory("/(auth)/verify-code");
      });

      // Auth routes clear history
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Route Mapping Integration", () => {
    it("should correctly map all production routes", () => {
      const productionRoutes = [
        routes.production.schedule.root,
        routes.production.airbrushings.root,
        routes.production.garages.root,
        routes.production.trucks.root,
      ];

      productionRoutes.forEach((route) => {
        const mobilePath = routeToMobilePath(route);
        expect(mobilePath).toContain("/(tabs)/production");
      });
    });

    it("should correctly map all inventory routes", () => {
      const inventoryRoutes = [
        routes.inventory.products.root,
        routes.inventory.suppliers.root,
        routes.inventory.orders.root,
      ];

      inventoryRoutes.forEach((route) => {
        const mobilePath = routeToMobilePath(route);
        expect(mobilePath).toContain("/(tabs)/inventory");
      });
    });

    it("should map Portuguese routes to English paths", () => {
      const portuguesePaths = [
        "/producao/cronograma",
        "/estoque/produtos",
        "/pintura/catalogo",
        "/recursos-humanos",
      ];

      portuguesePaths.forEach((path) => {
        const englishPath = getEnglishPath(path);
        expect(englishPath).not.toContain("producao");
        expect(englishPath).not.toContain("estoque");
        expect(englishPath).not.toContain("pintura");
      });
    });
  });

  describe("Deep Navigation Scenarios", () => {
    it("should handle deep link navigation to specific item", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const itemId = "550e8400-e29b-41d4-a716-446655440000";
      const deepLinkPath = `/(tabs)/production/schedule/details/${itemId}`;

      act(() => {
        result.current.pushToHistory(deepLinkPath);
      });

      // Coming from deep link, no back history
      expect(result.current.canGoBack).toBe(false);
    });

    it("should provide navigation after deep link", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/123");
        result.current.pushToHistory("/(tabs)/production/schedule/edit/123");
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe("Error Recovery Navigation", () => {
    it("should navigate to home on invalid route", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Attempt to go back with no history
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });

    it("should handle navigation to non-existent routes gracefully", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/non-existent-route");
      });

      // Should still be able to navigate
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Complex Navigation Patterns", () => {
    it("should handle master-detail navigation pattern", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // List → Detail → Edit → Back to Detail → Back to List
      act(() => {
        result.current.pushToHistory("/(tabs)/inventory/products/list");
        result.current.pushToHistory("/(tabs)/inventory/products/details/123");
        result.current.pushToHistory("/(tabs)/inventory/products/edit/123");
      });

      expect(result.current.canGoBack).toBe(true);

      // Go back to details
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should handle modal-like navigation pattern", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Open create modal from list
      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/create");
      });

      // Close modal (go back)
      act(() => {
        result.current.goBack();
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production/schedule/list");
    });

    it("should handle tab-like navigation between peer routes", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Switch between peer routes in personal section
      act(() => {
        result.current.pushToHistory("/(tabs)/personal/my-profile");
        result.current.pushToHistory("/(tabs)/personal/my-notifications");
        result.current.pushToHistory("/(tabs)/personal/my-vacations");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/personal/my-notifications");
    });
  });

  describe("Privilege-based Navigation", () => {
    it("should filter navigation options based on privileges", () => {
      const productionUser = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const menu = getFilteredMenuForUser(MENU_ITEMS, productionUser, "mobile");

      // Production user should not see admin items
      const adminItem = menu.find((item) => item.id === "administracao");
      expect(adminItem).toBeUndefined();

      // But should see production items
      const productionItem = menu.find((item) => item.id === "producao");
      expect(productionItem).toBeDefined();
    });

    it("should allow navigation to accessible routes", async () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // Production user navigating to production module
      act(() => {
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production/schedule");
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });
});
