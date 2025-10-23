import {
  getFilteredMenuForUser,
  getTablerIcon,
  filterMenuByPrivileges,
  filterMenuByPlatform,
  getAllRoutes,
  findMenuItemByPath,
  getBreadcrumbs,
  hasAccessToMenuItem,
} from "@/utils/navigation";
import { MENU_ITEMS } from "@/constants/navigation";
import { SECTOR_PRIVILEGES } from "@/constants/enums";

describe("Navigation Utils", () => {
  describe("getTablerIcon", () => {
    it("should return correct Tabler icon for valid key", () => {
      expect(getTablerIcon("home")).toBe("IconHome");
      expect(getTablerIcon("user")).toBe("IconUser");
      expect(getTablerIcon("factory")).toBe("IconBuilding");
    });

    it("should return original key for unknown icon", () => {
      expect(getTablerIcon("unknownIcon")).toBe("unknownIcon");
    });
  });

  describe("filterMenuByPlatform", () => {
    const testMenu = [
      {
        id: "item1",
        title: "Item 1",
        icon: "home",
        path: "/item1",
      },
      {
        id: "item2",
        title: "Item 2",
        icon: "user",
        path: "/item2",
        excludeFromMobile: true,
      },
      {
        id: "item3",
        title: "Item 3",
        icon: "settings",
        path: "/item3",
        children: [
          {
            id: "item3-1",
            title: "Item 3-1",
            icon: "cog",
            path: "/item3/child1",
            excludeFromMobile: true,
          },
          {
            id: "item3-2",
            title: "Item 3-2",
            icon: "bell",
            path: "/item3/child2",
          },
        ],
      },
    ];

    it("should include all items for web platform", () => {
      const filtered = filterMenuByPlatform(testMenu, "web");
      expect(filtered).toHaveLength(3);
      expect(filtered[1].id).toBe("item2");
    });

    it("should exclude mobile-excluded items for mobile platform", () => {
      const filtered = filterMenuByPlatform(testMenu, "mobile");
      expect(filtered).toHaveLength(2);
      expect(filtered.find((item) => item.id === "item2")).toBeUndefined();
    });

    it("should filter children items for mobile", () => {
      const filtered = filterMenuByPlatform(testMenu, "mobile");
      const item3 = filtered.find((item) => item.id === "item3");
      expect(item3?.children).toHaveLength(1);
      expect(item3?.children?.[0].id).toBe("item3-2");
    });
  });

  describe("filterMenuByPrivileges", () => {
    const testMenu = [
      {
        id: "public",
        title: "Public",
        icon: "home",
        path: "/public",
      },
      {
        id: "admin-only",
        title: "Admin Only",
        icon: "shield",
        path: "/admin",
        requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
      },
      {
        id: "multi-privilege",
        title: "Multi Privilege",
        icon: "users",
        path: "/multi",
        requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LEADER],
      },
      {
        id: "parent-with-children",
        title: "Parent",
        icon: "folder",
        path: "/parent",
        children: [
          {
            id: "child-admin",
            title: "Child Admin",
            icon: "key",
            path: "/parent/admin",
            requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
          },
          {
            id: "child-public",
            title: "Child Public",
            icon: "eye",
            path: "/parent/public",
          },
        ],
      },
    ];

    it("should return all public items when no privilege provided", () => {
      const filtered = filterMenuByPrivileges(testMenu, undefined);
      expect(filtered.find((item) => item.id === "public")).toBeDefined();
      expect(filtered.find((item) => item.id === "admin-only")).toBeUndefined();
    });

    it("should return admin items for admin privilege", () => {
      const filtered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.ADMIN);
      expect(filtered.find((item) => item.id === "admin-only")).toBeDefined();
      expect(filtered.find((item) => item.id === "public")).toBeDefined();
    });

    it("should handle array of privileges correctly", () => {
      const filtered = filterMenuByPrivileges(testMenu, SECTOR_PRIVILEGES.LEADER);
      expect(filtered.find((item) => item.id === "multi-privilege")).toBeDefined();
    });

    it("should filter children based on privileges", () => {
      const filtered = filterMenuByPrivileges(testMenu, undefined);
      const parent = filtered.find((item) => item.id === "parent-with-children");
      expect(parent?.children).toHaveLength(1);
      expect(parent?.children?.[0].id).toBe("child-public");
    });

    it("should remove parent if all children are filtered out", () => {
      const menuWithOnlyPrivilegedChildren = [
        {
          id: "parent",
          title: "Parent",
          icon: "folder",
          children: [
            {
              id: "child-admin",
              title: "Child Admin",
              icon: "key",
              path: "/parent/admin",
              requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
            },
          ],
        },
      ];

      const filtered = filterMenuByPrivileges(menuWithOnlyPrivilegedChildren, SECTOR_PRIVILEGES.PRODUCTION);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("getFilteredMenuForUser", () => {
    const testMenu = [
      {
        id: "admin-item",
        title: "Admin Item",
        icon: "shield",
        path: "/admin",
        requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
        excludeFromMobile: true,
      },
      {
        id: "public-item",
        title: "Public Item",
        icon: "home",
        path: "/public",
      },
    ];

    it("should apply both platform and privilege filters", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.ADMIN,
        },
      };

      const filtered = getFilteredMenuForUser(testMenu, user, "mobile");
      // Admin item should be filtered out due to mobile exclusion
      expect(filtered.find((item) => item.id === "admin-item")).toBeUndefined();
      expect(filtered.find((item) => item.id === "public-item")).toBeDefined();
    });

    it("should work with position sector privileges", () => {
      const user = {
        position: {
          sector: {
            privileges: SECTOR_PRIVILEGES.ADMIN,
          },
        },
      };

      const filtered = getFilteredMenuForUser(testMenu, user, "web");
      expect(filtered.find((item) => item.id === "admin-item")).toBeDefined();
    });
  });

  describe("getAllRoutes", () => {
    const testMenu = [
      {
        id: "item1",
        title: "Item 1",
        icon: "home",
        path: "/item1",
      },
      {
        id: "item2",
        title: "Item 2",
        icon: "user",
        path: "/item2/:id",
        isDynamic: true,
      },
      {
        id: "item3",
        title: "Item 3",
        icon: "folder",
        children: [
          {
            id: "item3-1",
            title: "Item 3-1",
            icon: "file",
            path: "/item3/child",
          },
        ],
      },
    ];

    it("should extract all static routes", () => {
      const routes = getAllRoutes(testMenu);
      expect(routes).toContain("/item1");
      expect(routes).toContain("/item3/child");
    });

    it("should exclude dynamic routes", () => {
      const routes = getAllRoutes(testMenu);
      expect(routes).not.toContain("/item2/:id");
    });

    it("should work with real MENU_ITEMS", () => {
      const routes = getAllRoutes(MENU_ITEMS);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes).toContain("/");
    });
  });

  describe("findMenuItemByPath", () => {
    const testMenu = [
      {
        id: "item1",
        title: "Item 1",
        icon: "home",
        path: "/item1",
      },
      {
        id: "item2",
        title: "Item 2",
        icon: "folder",
        children: [
          {
            id: "item2-1",
            title: "Item 2-1",
            icon: "file",
            path: "/item2/child",
          },
        ],
      },
    ];

    it("should find top-level items", () => {
      const item = findMenuItemByPath(testMenu, "/item1");
      expect(item?.id).toBe("item1");
    });

    it("should find nested items", () => {
      const item = findMenuItemByPath(testMenu, "/item2/child");
      expect(item?.id).toBe("item2-1");
    });

    it("should return null for non-existent paths", () => {
      const item = findMenuItemByPath(testMenu, "/nonexistent");
      expect(item).toBeNull();
    });
  });

  describe("getBreadcrumbs", () => {
    const testMenu = [
      {
        id: "parent",
        title: "Parent",
        icon: "folder",
        path: "/parent",
        children: [
          {
            id: "child",
            title: "Child",
            icon: "file",
            path: "/parent/child",
            children: [
              {
                id: "grandchild",
                title: "Grandchild",
                icon: "file",
                path: "/parent/child/grandchild",
              },
            ],
          },
        ],
      },
    ];

    it("should return breadcrumbs for nested path", () => {
      const breadcrumbs = getBreadcrumbs(testMenu, "/parent/child/grandchild");
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].id).toBe("parent");
      expect(breadcrumbs[1].id).toBe("child");
      expect(breadcrumbs[2].id).toBe("grandchild");
    });

    it("should return single breadcrumb for top-level path", () => {
      const breadcrumbs = getBreadcrumbs(testMenu, "/parent");
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].id).toBe("parent");
    });

    it("should handle dynamic routes", () => {
      const dynamicMenu = [
        {
          id: "parent",
          title: "Parent",
          icon: "folder",
          path: "/parent/:id",
        },
      ];

      const breadcrumbs = getBreadcrumbs(dynamicMenu, "/parent/123");
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].id).toBe("parent");
    });

    it("should return empty array for non-existent path", () => {
      const breadcrumbs = getBreadcrumbs(testMenu, "/nonexistent");
      expect(breadcrumbs).toHaveLength(0);
    });
  });

  describe("hasAccessToMenuItem", () => {
    it("should allow access to items without privilege requirement", () => {
      const item = {
        id: "public",
        title: "Public",
        icon: "home",
        path: "/public",
      };
      expect(hasAccessToMenuItem(item, undefined)).toBe(true);
    });

    it("should deny access when user has no privilege", () => {
      const item = {
        id: "admin",
        title: "Admin",
        icon: "shield",
        path: "/admin",
        requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
      };
      expect(hasAccessToMenuItem(item, undefined)).toBe(false);
    });

    it("should allow access for matching privilege", () => {
      const item = {
        id: "admin",
        title: "Admin",
        icon: "shield",
        path: "/admin",
        requiredPrivilege: SECTOR_PRIVILEGES.ADMIN,
      };
      expect(hasAccessToMenuItem(item, SECTOR_PRIVILEGES.ADMIN)).toBe(true);
    });

    it("should handle array of privileges", () => {
      const item = {
        id: "multi",
        title: "Multi",
        icon: "users",
        path: "/multi",
        requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LEADER],
      };
      expect(hasAccessToMenuItem(item, SECTOR_PRIVILEGES.LEADER)).toBe(true);
      expect(hasAccessToMenuItem(item, SECTOR_PRIVILEGES.PRODUCTION)).toBe(false);
    });
  });

  describe("Real Menu Integration", () => {
    it("should have valid menu structure", () => {
      expect(Array.isArray(MENU_ITEMS)).toBe(true);
      expect(MENU_ITEMS.length).toBeGreaterThan(0);
    });

    it("should have home route as first item", () => {
      expect(MENU_ITEMS[0].id).toBe("home");
      expect(MENU_ITEMS[0].path).toBe("/");
    });

    it("should filter admin items correctly", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.PRODUCTION,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const adminItem = filtered.find((item) => item.id === "administracao");

      // Admin section should not be visible to production users
      expect(adminItem).toBeUndefined();
    });

    it("should show appropriate items for warehouse privilege", () => {
      const user = {
        sector: {
          privileges: SECTOR_PRIVILEGES.WAREHOUSE,
        },
      };

      const filtered = getFilteredMenuForUser(MENU_ITEMS, user, "mobile");
      const inventoryItem = filtered.find((item) => item.id === "estoque");

      expect(inventoryItem).toBeDefined();
    });
  });
});
