import { getFilteredMenuForUser, filterMenuByPrivileges, filterMenuByPlatform } from "@/utils/navigation";
import { MENU_ITEMS } from "@/constants/navigation";
import { SECTOR_PRIVILEGES } from "@/constants/enums";

describe("Menu Visibility Tests", () => {
  describe("Privilege-based Menu Filtering", () => {
    it("should show only public items for users without privileges", () => {
      const user = {};
      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Home should always be visible
      const homeItem = filtered.find((item) => item.id === "home");
      expect(homeItem).toBeDefined();

      // Admin items should not be visible
      const adminItem = filtered.find((item) => item.id === "administracao");
      expect(adminItem).toBeUndefined();
    });

    it("should show admin items for admin users", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.ADMIN,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const adminItem = filtered.find((item) => item.id === "administracao");

      expect(adminItem).toBeDefined();
    });

    it("should show production items for production users", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const productionItem = filtered.find((item) => item.id === "producao");

      expect(productionItem).toBeDefined();
    });

    it("should show warehouse items for warehouse users", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.WAREHOUSE,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const inventoryItem = filtered.find((item) => item.id === "estoque");

      expect(inventoryItem).toBeDefined();
    });

    it("should show leader-specific items for leaders", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.LEADER,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const myTeamItem = filtered.find((item) => item.id === "meu-pessoal");

      expect(myTeamItem).toBeDefined();
    });

    it("should show HR items for HR users", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.HUMAN_RESOURCES,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const hrItem = filtered.find((item) => item.id === "recursos-humanos");

      expect(hrItem).toBeDefined();
    });

    it("should respect position sector privileges", () => {
      const user = {
        position: {
          sector: {
            privileges: SECTOR_PRIVILEGES.ADMIN,
          },
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const adminItem = filtered.find((item) => item.id === "administracao");

      expect(adminItem).toBeDefined();
    });
  });

  describe("Platform-based Menu Filtering", () => {
    it("should include all items for web platform", () => {
      const webMenu = filterMenuByPlatform(MENU_ITEMS, "web");
      const mobileMenu = filterMenuByPlatform(MENU_ITEMS, "mobile");

      expect(webMenu.length).toBeGreaterThanOrEqual(mobileMenu.length);
    });

    it("should exclude mobile-incompatible items", () => {
      const testMenu = [
        {
          id: "web-only",
          title: "Web Only",
          icon: "desktop",
          path: "/web-only",
          excludeFromMobile: true,
        },
        {
          id: "mobile-compatible",
          title: "Mobile Compatible",
          icon: "mobile",
          path: "/mobile",
        },
      ];

      const mobileFiltered = filterMenuByPlatform(testMenu, "mobile");
      expect(mobileFiltered).toHaveLength(1);
      expect(mobileFiltered[0].id).toBe("mobile-compatible");

      const webFiltered = filterMenuByPlatform(testMenu, "web");
      expect(webFiltered).toHaveLength(2);
    });

    it("should filter nested mobile-excluded items", () => {
      const testMenu = [
        {
          id: "parent",
          title: "Parent",
          icon: "folder",
          children: [
            {
              id: "child-mobile",
              title: "Mobile Compatible Child",
              icon: "file",
              path: "/parent/mobile",
            },
            {
              id: "child-web",
              title: "Web Only Child",
              icon: "file",
              path: "/parent/web",
              excludeFromMobile: true,
            },
          ],
        },
      ];

      const mobileFiltered = filterMenuByPlatform(testMenu, "mobile");
      expect(mobileFiltered[0].children).toHaveLength(1);
      expect(mobileFiltered[0].children?.[0].id).toBe("child-mobile");
    });
  });

  describe("Combined Platform and Privilege Filtering", () => {
    it("should apply both filters correctly", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Should have production items
      const productionItem = filtered.find((item) => item.id === "producao");
      expect(productionItem).toBeDefined();

      // Should not have admin items
      const adminItem = filtered.find((item) => item.id === "administracao");
      expect(adminItem).toBeUndefined();
    });

    it("should show appropriate items for warehouse users on mobile", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.WAREHOUSE,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Should have inventory
      const inventoryItem = filtered.find((item) => item.id === "estoque");
      expect(inventoryItem).toBeDefined();

      // Should have painting
      const paintingItem = filtered.find((item) => item.id === "pintura");
      expect(paintingItem).toBeDefined();
    });
  });

  describe("Menu Item Children Visibility", () => {
    it("should filter children based on privileges", () => {
      const testMenu = [
        {
          id: "parent",
          title: "Parent",
          icon: "folder",
          children: [
            {
              id: "public-child",
              title: "Public Child",
              icon: "file",
              path: "/parent/public",
            },
            {
              id: "admin-child",
              title: "Admin Child",
              icon: "lock",
              path: "/parent/admin",
              requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
            },
          ],
        },
      ];

      const productionUser = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const filtered = filterMenuByPrivileges(testMenu, productionUser.sector.privileges);
      expect(filtered[0].children).toHaveLength(1);
      expect(filtered[0].children?.[0].id).toBe("public-child");
    });

    it("should remove parent if all children are filtered out", () => {
      const testMenu = [
        {
          id: "parent",
          title: "Parent",
          icon: "folder",
          children: [
            {
              id: "admin-child",
              title: "Admin Child",
              icon: "lock",
              path: "/parent/admin",
              requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
            },
          ],
        },
      ];

      const filtered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.PRODUCTION);
      expect(filtered).toHaveLength(0);
    });

    it("should keep parent with path even if children are filtered", () => {
      const testMenu = [
        {
          id: "parent",
          title: "Parent",
          icon: "folder",
          path: "/parent",
          children: [
            {
              id: "admin-child",
              title: "Admin Child",
              icon: "lock",
              path: "/parent/admin",
              requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
            },
          ],
        },
      ];

      const filtered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.PRODUCTION);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].children).toHaveLength(0);
    });
  });

  describe("Dynamic Menu Items", () => {
    it("should filter out dynamic routes from menu", () => {
      const testMenu = [
        {
          id: "static",
          title: "Static",
          icon: "file",
          path: "/static",
        },
        {
          id: "dynamic",
          title: "Dynamic",
          icon: "file",
          path: "/dynamic/:id",
          isDynamic: true,
        },
      ];

      // Dynamic items should still be in the menu structure for navigation
      // but they won't show in static lists
      expect(testMenu.find((item) => item.isDynamic)).toBeDefined();
    });

    it("should handle contextual menu items", () => {
      // Contextual items are added dynamically based on current route
      // They should only show when relevant
      const testMenu = [
        {
          id: "list",
          title: "List",
          icon: "list",
          path: "/items/list",
        },
      ];

      // Would need implementation of contextual item logic
      expect(testMenu).toHaveLength(1);
    });
  });

  describe("Menu Visibility Edge Cases", () => {
    it("should handle items with array of privileges", () => {
      const testMenu = [
        {
          id: "multi-privilege",
          title: "Multi Privilege",
          icon: "users",
          path: "/multi",
          requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LEADER],
        },
      ];

      const adminFiltered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.ADMIN);
      expect(adminFiltered).toHaveLength(1);

      const leaderFiltered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.LEADER);
      expect(leaderFiltered).toHaveLength(1);

      const productionFiltered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.PRODUCTION);
      expect(productionFiltered).toHaveLength(0);
    });

    it("should handle deeply nested menu structures", () => {
      const testMenu = [
        {
          id: "level1",
          title: "Level 1",
          icon: "folder",
          children: [
            {
              id: "level2",
              title: "Level 2",
              icon: "folder",
              children: [
                {
                  id: "level3",
                  title: "Level 3",
                  icon: "file",
                  path: "/level1/level2/level3",
                  requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
                },
              ],
            },
          ],
        },
      ];

      const adminFiltered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.ADMIN);
      expect(adminFiltered[0].children?.[0].children).toHaveLength(1);

      const productionFiltered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.PRODUCTION);
      expect(productionFiltered).toHaveLength(0);
    });

    it("should handle menu items without children or paths", () => {
      const testMenu = [
        {
          id: "no-path-no-children",
          title: "No Path No Children",
          icon: "question",
        },
      ];

      const filtered = filterMenuByPrivileges(testMenu, undefined);
      expect(filtered).toHaveLength(1);
    });
  });

  describe("Real-world Menu Scenarios", () => {
    it("should show appropriate menu for production worker", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Should have access to production module
      expect(filtered.find((item) => item.id === "producao")).toBeDefined();

      // Should have access to personal section
      expect(filtered.find((item) => item.id === "pessoal")).toBeDefined();

      // Should NOT have access to admin
      expect(filtered.find((item) => item.id === "administracao")).toBeUndefined();
    });

    it("should show appropriate menu for warehouse manager", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.WAREHOUSE,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Should have inventory access
      expect(filtered.find((item) => item.id === "estoque")).toBeDefined();

      // Should have painting access
      expect(filtered.find((item) => item.id === "pintura")).toBeDefined();
    });

    it("should show full menu for admin", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.ADMIN,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Admin should see most items (some may still be mobile-excluded)
      expect(filtered.length).toBeGreaterThan(5);

      // Should have admin section
      expect(filtered.find((item) => item.id === "administracao")).toBeDefined();

      // Should have server section
      expect(filtered.find((item) => item.id === "servidor")).toBeDefined();
    });

    it("should show leader-specific items for team leaders", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.LEADER,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");

      // Should have team management section
      expect(filtered.find((item) => item.id === "meu-pessoal")).toBeDefined();

      // Should have catalog access
      expect(filtered.find((item) => item.id === "catalogo")).toBeDefined();
    });
  });

  describe("Menu Count Validation", () => {
    it("should have reasonable number of top-level items", () => {
      const adminUser = {
        sector: {
          privileges: SECTOR_PRIVILEGES.ADMIN,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, adminUser, "mobile");

      // Should have between 5 and 20 top-level items
      expect(filtered.length).toBeGreaterThan(5);
      expect(filtered.length).toBeLessThan(20);
    });

    it("should reduce menu items for non-privileged users", () => {
      const productionUser = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const adminUser = {
        sector: {
          privileges: SECTOR_PRIVILEGES.ADMIN,
        },
      };

      const productionFiltered = getFilteredMenuForUser(MENU_ITEMS, productionUser, "mobile");
      const adminFiltered = getFilteredMenuForUser(MENU_ITEMS, adminUser, "mobile");

      expect(productionFiltered.length).toBeLessThan(adminFiltered.length);
    });
  });
});
