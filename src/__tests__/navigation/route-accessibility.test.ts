import { routes } from "@/constants/routes";
import { MENU_ITEMS } from "@/constants/navigation";
import { getEnglishPath, routeToMobilePath } from "@/lib/route-mapper";
import { getAllRoutes } from "@/utils/navigation";

describe("Route Accessibility Tests", () => {
  describe("Route Constants Validation", () => {
    it("should have defined home route", () => {
      expect(routes.home).toBeDefined();
      expect(routes.home).toBe("/");
    });

    it("should have all major module routes defined", () => {
      expect(routes.production).toBeDefined();
      expect(routes.inventory).toBeDefined();
      expect(routes.painting).toBeDefined();
      expect(routes.humanResources).toBeDefined();
      expect(routes.administration).toBeDefined();
      expect(routes.personal).toBeDefined();
    });

    it("should have authentication routes defined", () => {
      expect(routes.authentication.login).toBeDefined();
      expect(routes.authentication.register).toBeDefined();
      expect(routes.authentication.recoverPassword).toBeDefined();
      expect(routes.authentication.verifyCode).toBeDefined();
    });
  });

  describe("Route Structure Validation", () => {
    it("should have consistent route structure for CRUD operations", () => {
      const crudModules = [
        routes.production.airbrushings,
        routes.production.garages,
        routes.production.trucks,
        routes.inventory.products,
        routes.inventory.suppliers,
      ];

      crudModules.forEach((module) => {
        expect(module.root).toBeDefined();
        expect(module.create).toBeDefined();
        expect(module.list).toBeDefined();
        expect(typeof module.details).toBe("function");
        expect(typeof module.edit).toBe("function");
      });
    });

    it("should have valid dynamic route generators", () => {
      const testId = "test-uuid-123";

      expect(routes.production.schedule.details(testId)).toContain(testId);
      expect(routes.inventory.products.details(testId)).toContain(testId);
      expect(routes.administration.customers.details(testId)).toContain(testId);
    });

    it("should not have undefined or null routes", () => {
      const checkRoutes = (obj: any, path = ""): string[] => {
        const issues: string[] = [];

        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;

          if (value === undefined || value === null) {
            issues.push(`Undefined route at: ${currentPath}`);
          } else if (typeof value === "object" && !Array.isArray(value)) {
            issues.push(...checkRoutes(value, currentPath));
          }
        });

        return issues;
      };

      const issues = checkRoutes(routes);
      expect(issues).toHaveLength(0);
    });
  });

  describe("Route Mapper Validation", () => {
    it("should map Portuguese routes to English paths", () => {
      expect(getEnglishPath("/producao")).toBe("/production");
      expect(getEnglishPath("/estoque")).toBe("/inventory");
      expect(getEnglishPath("/pintura")).toBe("/painting");
      expect(getEnglishPath("/recursos-humanos")).toBe("/human-resources");
    });

    it("should handle nested routes correctly", () => {
      expect(getEnglishPath("/producao/cronograma")).toBe("/production/schedule");
      expect(getEnglishPath("/estoque/produtos")).toBe("/inventory/products");
      expect(getEnglishPath("/pintura/catalogo")).toBe("/painting/catalog");
    });

    it("should handle routes with dynamic segments", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(getEnglishPath(`/producao/cronograma/detalhes/${uuid}`)).toContain("details");
      expect(getEnglishPath(`/estoque/produtos/editar/${uuid}`)).toContain("edit");
    });

    it("should convert routes to mobile paths with tabs prefix", () => {
      expect(routeToMobilePath(routes.home)).toBe("/(tabs)/home");
      expect(routeToMobilePath(routes.production.root)).toBe("/(tabs)/production");
      expect(routeToMobilePath(routes.inventory.root)).toBe("/(tabs)/inventory");
    });

    it("should convert auth routes without tabs prefix", () => {
      expect(routeToMobilePath(routes.authentication.login)).toContain("/(auth)/");
      expect(routeToMobilePath(routes.authentication.register)).toContain("/(auth)/");
    });
  });

  describe("Menu Items Validation", () => {
    it("should have valid icon mappings for all menu items", () => {
      const checkIcons = (items: any[]): string[] => {
        const invalidIcons: string[] = [];

        items.forEach((item) => {
          if (!item.icon) {
            invalidIcons.push(`Missing icon for: ${item.id}`);
          }

          if (item.children) {
            invalidIcons.push(...checkIcons(item.children));
          }
        });

        return invalidIcons;
      };

      const invalidIcons = checkIcons(MENU_ITEMS);
      expect(invalidIcons).toHaveLength(0);
    });

    it("should have valid paths or children for all menu items", () => {
      const checkPathsOrChildren = (items: any[]): string[] => {
        const issues: string[] = [];

        items.forEach((item) => {
          if (!item.path && (!item.children || item.children.length === 0)) {
            issues.push(`No path or children for: ${item.id}`);
          }

          if (item.children) {
            issues.push(...checkPathsOrChildren(item.children));
          }
        });

        return issues;
      };

      const issues = checkPathsOrChildren(MENU_ITEMS);
      expect(issues).toHaveLength(0);
    });

    it("should not have duplicate menu item IDs", () => {
      const collectIds = (items: any[]): string[] => {
        const ids: string[] = [];

        items.forEach((item) => {
          ids.push(item.id);
          if (item.children) {
            ids.push(...collectIds(item.children));
          }
        });

        return ids;
      };

      const allIds = collectIds(MENU_ITEMS);
      const uniqueIds = new Set(allIds);

      expect(allIds.length).toBe(uniqueIds.size);
    });

    it("should have titles for all menu items", () => {
      const checkTitles = (items: any[]): string[] => {
        const missing: string[] = [];

        items.forEach((item) => {
          if (!item.title) {
            missing.push(item.id);
          }

          if (item.children) {
            missing.push(...checkTitles(item.children));
          }
        });

        return missing;
      };

      const missing = checkTitles(MENU_ITEMS);
      expect(missing).toHaveLength(0);
    });
  });

  describe("Route Coverage Tests", () => {
    it("should have menu items for main production routes", () => {
      const routes = getAllRoutes(MENU_ITEMS);

      expect(routes).toContain("/producao");
      expect(routes).toContain("/producao/cronograma");
      expect(routes).toContain("/producao/aerografia");
    });

    it("should have menu items for main inventory routes", () => {
      const routes = getAllRoutes(MENU_ITEMS);

      expect(routes).toContain("/estoque");
      expect(routes).toContain("/estoque/produtos");
      expect(routes).toContain("/estoque/fornecedores");
    });

    it("should have menu items for administration routes", () => {
      const routes = getAllRoutes(MENU_ITEMS);

      expect(routes).toContain("/administracao");
      expect(routes).toContain("/administracao/clientes");
    });

    it("should extract reasonable number of routes", () => {
      const routes = getAllRoutes(MENU_ITEMS);
      // Should have at least 20 routes but less than 500
      expect(routes.length).toBeGreaterThan(20);
      expect(routes.length).toBeLessThan(500);
    });
  });

  describe("Deep Linking Support", () => {
    it("should support deep link scheme", () => {
      // Verify the app.json scheme is set
      const appJson = require("@/../app.json");
      expect(appJson.expo.scheme).toBeDefined();
    });

    it("should handle deep link paths correctly", () => {
      const testPaths = [
        "/production/schedule/details/123",
        "/inventory/products/edit/456",
        "/personal/my-profile",
      ];

      testPaths.forEach((path) => {
        expect(() => getEnglishPath(path)).not.toThrow();
      });
    });
  });

  describe("Route Parameter Validation", () => {
    it("should handle UUID parameters correctly", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";

      const detailsPath = routes.production.schedule.details(validUUID);
      expect(detailsPath).toContain(validUUID);

      const editPath = routes.inventory.products.edit(validUUID);
      expect(editPath).toContain(validUUID);
    });

    it("should handle special parameter routes", () => {
      const orderId = "order-123";
      const itemId = "item-456";

      const itemsPath = routes.inventory.orders.items.list(orderId);
      expect(itemsPath).toContain(orderId);

      const itemEditPath = routes.inventory.orders.items.edit(orderId, itemId);
      expect(itemEditPath).toContain(orderId);
      expect(itemEditPath).toContain(itemId);
    });
  });

  describe("Route Edge Cases", () => {
    it("should handle root route consistently", () => {
      expect(routes.home).toBe("/");
      expect(routeToMobilePath(routes.home)).toBe("/(tabs)/home");
    });

    it("should handle routes with special characters", () => {
      // Test routes with hyphens
      expect(routes.humanResources.root).toContain("-");
      expect(getEnglishPath(routes.humanResources.root)).toContain("-");
    });

    it("should handle empty or undefined inputs gracefully", () => {
      // @ts-expect-error - Testing error handling
      expect(() => routeToMobilePath(null)).not.toThrow();
      // @ts-expect-error - Testing error handling
      expect(() => routeToMobilePath(undefined)).not.toThrow();
    });
  });

  describe("Cross-Module Route Consistency", () => {
    it("should have consistent naming patterns across modules", () => {
      const modules = [
        routes.production,
        routes.inventory,
        routes.painting,
        routes.humanResources,
      ];

      modules.forEach((module) => {
        expect(module.root).toBeDefined();
        expect(typeof module.root).toBe("string");
        expect(module.root).toMatch(/^\//);
      });
    });

    it("should have consistent detail/edit patterns", () => {
      const testId = "test-id";

      // All detail routes should contain 'detalhes' in Portuguese
      expect(routes.production.schedule.details(testId)).toContain("detalhes");
      expect(routes.inventory.products.details(testId)).toContain("detalhes");

      // All edit routes should contain 'editar' in Portuguese
      expect(routes.production.schedule.edit(testId)).toContain("editar");
      expect(routes.inventory.products.edit(testId)).toContain("editar");
    });

    it("should have consistent create patterns", () => {
      // All create routes should contain 'cadastrar' in Portuguese
      expect(routes.production.schedule.create).toContain("cadastrar");
      expect(routes.inventory.products.create).toContain("cadastrar");
      expect(routes.administration.customers.create).toContain("cadastrar");
    });

    it("should have consistent list patterns", () => {
      // List routes may contain 'listar' or be the root
      const listRoutes = [
        routes.production.schedule.list,
        routes.inventory.products.list,
        routes.administration.customers.list,
      ];

      listRoutes.forEach((route) => {
        expect(route).toBeDefined();
        expect(typeof route).toBe("string");
      });
    });
  });
});
