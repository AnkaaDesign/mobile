/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { NavigationHistoryProvider, useNavigationHistory } from "@/contexts/navigation-history-context";
import { routes } from "@/constants/routes";
import { routeToMobilePath } from "@/lib/route-mapper";

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

describe("Schedule Navigation Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/(tabs)/home";
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
  );

  describe("Schedule List to Detail Navigation", () => {
    it("should navigate from schedule list to detail page", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "schedule-123";
      const listPath = routeToMobilePath(routes.production.schedule.list);
      const detailPath = routeToMobilePath(routes.production.schedule.details(scheduleId));

      act(() => {
        result.current.pushToHistory(listPath);
        result.current.pushToHistory(detailPath);
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe(listPath);
    });

    it("should navigate back from detail to schedule list", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "schedule-456";

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });

    it("should preserve schedule ID in back navigation", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "550e8400-e29b-41d4-a716-446655440000";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${scheduleId}`);
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toContain(scheduleId);
      expect(backPath).toContain("details");
    });
  });

  describe("Schedule Module to Detail Flow", () => {
    it("should navigate from production root to schedule detail", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "task-789";

      const flow = [
        "/(tabs)/production",
        "/(tabs)/production/schedule",
        `/(tabs)/production/schedule/details/${scheduleId}`,
      ];

      for (const path of flow) {
        act(() => {
          result.current.pushToHistory(path);
        });
      }

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production/schedule");
    });

    it("should navigate through complete schedule flow", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "schedule-complete";

      act(() => {
        // Home → Production → Schedule List → Details
        result.current.pushToHistory("/(tabs)/home");
        result.current.pushToHistory("/(tabs)/production");
        result.current.pushToHistory("/(tabs)/production/schedule");
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);

      // Navigate back step by step
      act(() => {
        result.current.goBack();
      });
      expect(result.current.getBackPath()).toBe("/(tabs)/production/schedule/list");

      act(() => {
        result.current.goBack();
      });
      expect(result.current.getBackPath()).toBe("/(tabs)/production/schedule");
    });
  });

  describe("Schedule CRUD Operations", () => {
    it("should navigate from schedule list to create new schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/create");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production/schedule/list");
    });

    it("should navigate from detail to edit schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "edit-schedule-123";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${scheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toContain("details");
      expect(backPath).toContain(scheduleId);
    });

    it("should navigate back to list after creating schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/create");
      });

      // After save, go back
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should navigate back to detail after editing schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "edit-back-123";

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${scheduleId}`);
      });

      // After save, go back to detail
      act(() => {
        result.current.goBack();
      });

      const backPath = result.current.getBackPath();
      expect(backPath).toBe("/(tabs)/production/schedule/list");
    });
  });

  describe("Schedule Detail Actions", () => {
    it("should navigate from schedule detail to related resources", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "schedule-with-resources";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        // Navigate to related garage
        result.current.pushToHistory("/(tabs)/production/garages/details/garage-123");
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should navigate from schedule detail to customer details", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "schedule-with-customer";
      const customerId = "customer-456";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory(`/(tabs)/administration/customers/details/${customerId}`);
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toContain("schedule");
      expect(backPath).toContain(scheduleId);
    });
  });

  describe("Schedule Search and Filter Navigation", () => {
    it("should maintain navigation after filtering schedule list", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        // Filter applied (query params would be handled separately)
        result.current.pushToHistory("/(tabs)/production/schedule/list");
      });

      // Same route, should not duplicate
      expect(result.current.canGoBack).toBe(false);
    });

    it("should navigate from filtered list to detail", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "filtered-schedule-789";

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe("Schedule Deep Linking", () => {
    it("should handle deep link to schedule detail", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "deep-link-schedule-123";

      act(() => {
        // Direct deep link to detail
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
      });

      // No back history from deep link
      expect(result.current.canGoBack).toBe(false);
    });

    it("should allow navigation after deep linking to schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "deep-link-nav-456";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${scheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should handle deep link with invalid schedule ID", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/invalid-id");
      });

      // Should track the route even if ID is invalid
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe("Schedule Context Switching", () => {
    it("should handle switching between different schedule items", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/schedule-1");
        result.current.pushToHistory("/(tabs)/production/schedule/details/schedule-2");
        result.current.pushToHistory("/(tabs)/production/schedule/details/schedule-3");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toContain("schedule-2");
    });

    it("should maintain history when navigating between schedule and list", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/details/item-1");
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/details/item-2");
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe("Schedule Notification Navigation", () => {
    it("should navigate from notification to schedule detail", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "notification-schedule-123";

      act(() => {
        result.current.pushToHistory("/(tabs)/personal/my-notifications");
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toContain("notifications");
    });

    it("should navigate back to notifications after viewing schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/personal/my-notifications");
        result.current.pushToHistory("/(tabs)/production/schedule/details/schedule-from-notif");
      });

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe("Schedule Error Scenarios", () => {
    it("should handle navigation to non-existent schedule", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/non-existent-id");
      });

      // Should still track the route
      expect(result.current.canGoBack).toBe(false);
    });

    it("should handle back navigation when schedule is deleted", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/details/deleted-schedule");
      });

      // After deletion, navigate back
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it("should fallback to home if schedule module is unavailable", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // No history
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/(tabs)/home");
    });
  });

  describe("Schedule Route Mapping", () => {
    it("should correctly map schedule list route", () => {
      const listRoute = routes.production.schedule.list;
      const mobilePath = routeToMobilePath(listRoute);

      expect(mobilePath).toContain("production");
      expect(mobilePath).toContain("schedule");
      expect(mobilePath).toMatch(/^\(tabs\)\//);
    });

    it("should correctly map schedule detail route with ID", () => {
      const scheduleId = "test-schedule-uuid";
      const detailRoute = routes.production.schedule.details(scheduleId);
      const mobilePath = routeToMobilePath(detailRoute);

      expect(mobilePath).toContain("production");
      expect(mobilePath).toContain("schedule");
      expect(mobilePath).toContain("details");
      expect(mobilePath).toContain(scheduleId);
    });

    it("should correctly map schedule edit route with ID", () => {
      const scheduleId = "edit-schedule-uuid";
      const editRoute = routes.production.schedule.edit(scheduleId);
      const mobilePath = routeToMobilePath(editRoute);

      expect(mobilePath).toContain("production");
      expect(mobilePath).toContain("schedule");
      expect(mobilePath).toContain("edit");
      expect(mobilePath).toContain(scheduleId);
    });

    it("should correctly map schedule create route", () => {
      const createRoute = routes.production.schedule.create;
      const mobilePath = routeToMobilePath(createRoute);

      expect(mobilePath).toContain("production");
      expect(mobilePath).toContain("schedule");
      expect(mobilePath).toContain("create");
    });
  });

  describe("Schedule Multi-step Flows", () => {
    it("should support complete schedule creation workflow", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      // List → Create → (Save) → Detail → Edit → (Save) → Detail
      const newScheduleId = "new-schedule-123";

      act(() => {
        // Navigate to create
        result.current.pushToHistory("/(tabs)/production/schedule/list");
        result.current.pushToHistory("/(tabs)/production/schedule/create");
      });

      // After save, navigate to detail
      act(() => {
        result.current.goBack(); // Simulate save & redirect
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${newScheduleId}`);
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should support schedule edit and cancel workflow", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "cancel-edit-123";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory(`/(tabs)/production/schedule/edit/${scheduleId}`);
      });

      // Cancel edit, go back to detail
      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe("Schedule Integration with Other Modules", () => {
    it("should navigate from schedule to inventory", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/schedule-123");
        result.current.pushToHistory("/(tabs)/inventory/products/list");
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it("should navigate from schedule to painting module", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      act(() => {
        result.current.pushToHistory("/(tabs)/production/schedule/details/schedule-456");
        result.current.pushToHistory("/(tabs)/painting/catalog");
      });

      expect(result.current.canGoBack).toBe(true);

      const backPath = result.current.getBackPath();
      expect(backPath).toContain("schedule");
    });

    it("should navigate back to schedule from other modules", () => {
      const { result } = renderHook(() => useNavigationHistory(), { wrapper });

      const scheduleId = "cross-module-schedule";

      act(() => {
        result.current.pushToHistory(`/(tabs)/production/schedule/details/${scheduleId}`);
        result.current.pushToHistory("/(tabs)/administration/customers/list");
      });

      act(() => {
        result.current.goBack();
      });

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
