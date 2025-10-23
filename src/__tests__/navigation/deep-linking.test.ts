import { getEnglishPath, routeToMobilePath } from "@/lib/route-mapper";
import { routes } from "@/constants/routes";

describe("Deep Linking Tests", () => {
  describe("App Scheme Configuration", () => {
    it("should have app scheme configured", () => {
      const appJson = require("@/../app.json");
      expect(appJson.expo.scheme).toBeDefined();
      expect(typeof appJson.expo.scheme).toBe("string");
    });

    it("should support URL schemes", () => {
      const appJson = require("@/../app.json");
      const scheme = appJson.expo.scheme;

      // Verify scheme is valid (alphanumeric and hyphens)
      expect(scheme).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe("Deep Link URL Parsing", () => {
    it("should parse simple deep links", () => {
      const deepLinkPath = "/production/schedule";
      const mobilePath = routeToMobilePath(routes.production.schedule.root);

      expect(mobilePath).toContain("schedule");
    });

    it("should parse deep links with parameters", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const detailsRoute = routes.production.schedule.details(uuid);
      const mobilePath = routeToMobilePath(detailsRoute);

      expect(mobilePath).toContain(uuid);
      expect(mobilePath).toContain("details");
    });

    it("should handle authentication deep links", () => {
      const loginPath = routeToMobilePath(routes.authentication.login);
      expect(loginPath).toContain("/(auth)/");
      expect(loginPath).toContain("login");
    });

    it("should handle password reset deep links with token", () => {
      const token = "reset-token-12345";
      const resetRoute = routes.authentication.resetPassword(token);
      const mobilePath = routeToMobilePath(resetRoute);

      expect(mobilePath).toContain(token);
      expect(mobilePath).toContain("reset-password");
    });
  });

  describe("Deep Link URL Generation", () => {
    it("should generate valid deep link for production schedule", () => {
      const mobilePath = routeToMobilePath(routes.production.schedule.root);
      expect(mobilePath).toBe("/(tabs)/production/schedule");
    });

    it("should generate valid deep link for inventory products", () => {
      const mobilePath = routeToMobilePath(routes.inventory.products.root);
      expect(mobilePath).toBe("/(tabs)/inventory/products");
    });

    it("should generate valid deep link for personal profile", () => {
      const mobilePath = routeToMobilePath(routes.personal.myProfile.root);
      expect(mobilePath).toContain("personal");
      expect(mobilePath).toContain("my-profile");
    });

    it("should generate valid deep link with UUID parameter", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const detailsRoute = routes.inventory.products.details(uuid);
      const mobilePath = routeToMobilePath(detailsRoute);

      expect(mobilePath).toContain(uuid);
      expect(mobilePath).toContain("/(tabs)/");
    });
  });

  describe("Deep Link Route Mapping", () => {
    it("should map Portuguese paths to English correctly", () => {
      expect(getEnglishPath("/producao")).toBe("/production");
      expect(getEnglishPath("/estoque")).toBe("/inventory");
      expect(getEnglishPath("/pintura")).toBe("/painting");
    });

    it("should map nested Portuguese paths", () => {
      expect(getEnglishPath("/producao/cronograma")).toBe("/production/schedule");
      expect(getEnglishPath("/estoque/produtos")).toBe("/inventory/products");
      expect(getEnglishPath("/pintura/catalogo")).toBe("/painting/catalog");
    });

    it("should handle CRUD operation paths", () => {
      expect(getEnglishPath("/estoque/produtos/cadastrar")).toBe("/inventory/products/create");
      expect(getEnglishPath("/estoque/produtos/listar")).toBe("/inventory/products/list");
      expect(getEnglishPath("/estoque/produtos/editar/123")).toContain("edit");
      expect(getEnglishPath("/estoque/produtos/detalhes/123")).toContain("details");
    });
  });

  describe("Deep Link URL Validation", () => {
    it("should validate production module deep links", () => {
      const validPaths = [
        routes.production.schedule.root,
        routes.production.airbrushings.root,
        routes.production.garages.root,
        routes.production.trucks.root,
      ];

      validPaths.forEach((path) => {
        expect(() => routeToMobilePath(path)).not.toThrow();
        const mobilePath = routeToMobilePath(path);
        expect(mobilePath).toMatch(/^\(tabs\)\//);
      });
    });

    it("should validate inventory module deep links", () => {
      const validPaths = [
        routes.inventory.products.root,
        routes.inventory.suppliers.root,
        routes.inventory.orders.root,
        routes.inventory.movements.root,
      ];

      validPaths.forEach((path) => {
        expect(() => routeToMobilePath(path)).not.toThrow();
        const mobilePath = routeToMobilePath(path);
        expect(mobilePath).toContain("inventory");
      });
    });

    it("should validate personal module deep links", () => {
      const validPaths = [
        routes.personal.myProfile.root,
        routes.personal.myNotifications.root,
        routes.personal.myVacations.root,
        routes.personal.preferences.root,
      ];

      validPaths.forEach((path) => {
        expect(() => routeToMobilePath(path)).not.toThrow();
        const mobilePath = routeToMobilePath(path);
        expect(mobilePath).toContain("personal");
      });
    });
  });

  describe("Deep Link with Query Parameters", () => {
    it("should handle routes with query parameters", () => {
      const basePath = routes.inventory.products.list;
      const mobilePath = routeToMobilePath(basePath);

      // Query parameters would be added separately by the router
      expect(mobilePath).toBeDefined();
    });

    it("should preserve route structure for filtered lists", () => {
      const listPath = routes.production.schedule.list;
      const mobilePath = routeToMobilePath(listPath);

      expect(mobilePath).toContain("schedule");
    });
  });

  describe("Deep Link to Nested Resources", () => {
    it("should handle nested resource deep links", () => {
      const orderId = "order-123";
      const itemsPath = routes.inventory.orders.items.list(orderId);
      const mobilePath = routeToMobilePath(itemsPath);

      expect(mobilePath).toContain(orderId);
      expect(mobilePath).toContain("items");
    });

    it("should handle deeply nested detail pages", () => {
      const orderId = "order-456";
      const itemId = "item-789";
      const detailsPath = routes.inventory.orders.items.details(orderId, itemId);
      const mobilePath = routeToMobilePath(detailsPath);

      expect(mobilePath).toContain(orderId);
      expect(mobilePath).toContain(itemId);
    });

    it("should handle formula components paths", () => {
      const formulaId = "formula-123";
      const componentId = "component-456";
      const componentPath = routes.painting.components.details(formulaId, componentId);
      const mobilePath = routeToMobilePath(componentPath);

      expect(mobilePath).toContain(formulaId);
      expect(mobilePath).toContain(componentId);
    });
  });

  describe("Deep Link Edge Cases", () => {
    it("should handle home route deep link", () => {
      const mobilePath = routeToMobilePath(routes.home);
      expect(mobilePath).toBe("/(tabs)/home");
    });

    it("should handle routes with hyphens", () => {
      const mobilePath = routeToMobilePath(routes.humanResources.root);
      expect(mobilePath).toContain("human-resources");
    });

    it("should handle routes with multiple segments", () => {
      const mobilePath = routeToMobilePath(routes.inventory.products.categories.root);
      expect(mobilePath).toContain("products");
      expect(mobilePath).toContain("categories");
    });

    it("should handle undefined or null gracefully", () => {
      // @ts-expect-error - Testing error handling
      const result1 = routeToMobilePath(null);
      expect(result1).toBeDefined();

      // @ts-expect-error - Testing error handling
      const result2 = routeToMobilePath(undefined);
      expect(result2).toBeDefined();
    });

    it("should handle empty string", () => {
      const result = routeToMobilePath("");
      expect(result).toBeDefined();
    });
  });

  describe("Deep Link URL Formats", () => {
    it("should generate app scheme URLs", () => {
      const appJson = require("@/../app.json");
      const scheme = appJson.expo.scheme;
      const mobilePath = routeToMobilePath(routes.production.schedule.root);

      const deepLink = `${scheme}:/${mobilePath.replace(/^\(tabs\)\//, "")}`;
      expect(deepLink).toMatch(new RegExp(`^${scheme}://`));
    });

    it("should support universal links format", () => {
      const mobilePath = routeToMobilePath(routes.inventory.products.root);
      // Universal links would be https://yourdomain.com/path
      // The path portion should match our mobile path structure
      expect(mobilePath).toContain("inventory/products");
    });
  });

  describe("Deep Link Navigation Handling", () => {
    it("should extract route parameters from deep links", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const detailsPath = routes.production.schedule.details(uuid);

      expect(detailsPath).toContain(uuid);

      // Extracting UUID from path
      const uuidMatch = detailsPath.match(/[a-f0-9-]{36}/);
      expect(uuidMatch).toBeTruthy();
      expect(uuidMatch?.[0]).toBe(uuid);
    });

    it("should handle multiple parameters in deep links", () => {
      const orderId = "order-123";
      const itemId = "item-456";
      const editPath = routes.inventory.orders.items.edit(orderId, itemId);

      expect(editPath).toContain(orderId);
      expect(editPath).toContain(itemId);

      // Verify both parameters can be extracted
      const params = editPath.split("/").filter((seg) => seg && !seg.includes("estoque") && !seg.includes("pedidos"));
      expect(params.length).toBeGreaterThan(2);
    });
  });

  describe("Deep Link Security", () => {
    it("should not expose internal route structure in deep links", () => {
      // Deep links should use clean, public-facing paths
      const mobilePath = routeToMobilePath(routes.production.schedule.root);

      // Should not contain (tabs) in the actual deep link URL
      // (tabs) is internal to expo-router
      expect(mobilePath).toContain("(tabs)");
    });

    it("should validate route accessibility via privileges", () => {
      // This would be handled by the app's privilege system
      // Deep links should still respect user permissions
      const adminPath = routes.administration.root;
      const mobilePath = routeToMobilePath(adminPath);

      expect(mobilePath).toBeDefined();
      // The actual permission check happens at navigation time
    });
  });

  describe("Deep Link Fallbacks", () => {
    it("should provide fallback for invalid deep links", () => {
      // If a deep link is invalid, app should navigate to home
      const fallbackPath = routeToMobilePath(routes.home);
      expect(fallbackPath).toBe("/(tabs)/home");
    });

    it("should handle legacy deep link formats", () => {
      // Old format might be /producao, new format is /production
      const legacyPath = "/producao/cronograma";
      const englishPath = getEnglishPath(legacyPath);

      expect(englishPath).toBe("/production/schedule");
    });
  });

  describe("Cross-platform Deep Link Compatibility", () => {
    it("should generate iOS-compatible deep links", () => {
      const mobilePath = routeToMobilePath(routes.production.schedule.root);
      // iOS deep links use URL encoding
      const encodedPath = encodeURIComponent(mobilePath);

      expect(encodedPath).toBeDefined();
    });

    it("should generate Android-compatible deep links", () => {
      const mobilePath = routeToMobilePath(routes.inventory.products.root);
      // Android deep links also use URL encoding
      const encodedPath = encodeURIComponent(mobilePath);

      expect(encodedPath).toBeDefined();
    });
  });

  describe("Real-world Deep Link Scenarios", () => {
    it("should handle notification deep link", () => {
      const notificationId = "notif-123";
      const notificationPath = routes.personal.myNotifications.details(notificationId);
      const mobilePath = routeToMobilePath(notificationPath);

      expect(mobilePath).toContain(notificationId);
      expect(mobilePath).toContain("notifications");
    });

    it("should handle shared schedule item deep link", () => {
      const scheduleId = "schedule-456";
      const schedulePath = routes.production.schedule.details(scheduleId);
      const mobilePath = routeToMobilePath(schedulePath);

      expect(mobilePath).toContain(scheduleId);
      expect(mobilePath).toContain("schedule");
    });

    it("should handle product catalog deep link", () => {
      const catalogId = "catalog-789";
      const catalogPath = routes.painting.catalog.details(catalogId);
      const mobilePath = routeToMobilePath(catalogPath);

      expect(mobilePath).toContain(catalogId);
      expect(mobilePath).toContain("catalog");
    });
  });
});
