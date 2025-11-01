// app/(tabs)/_layout.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Drawer } from "expo-router/drawer";
import { View, Text as RNText, Pressable, Platform, ScrollView, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions, GestureResponderEvent } from "react-native";
// Use React Native's Text directly to avoid theme overrides
const Text = RNText;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { IconChevronRight, IconStar, IconStarFilled } from "@tabler/icons-react-native";
import { useRouter, usePathname } from "expo-router";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { MENU_ITEMS, routes, MenuItem } from '../../constants';
import { getFilteredMenuForUser, getTablerIcon } from '../../utils/navigation';
import { routeToMobilePath, normalizePath } from "@/lib/route-mapper";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { maskPhone } from '../../utils';

// Enhanced icon rendering with standardized sizing and theming
const getIconComponentLocal = (
  iconKey: string,
  variant: "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "info" | "navigation" | "navigationActive" | "onPrimary" = "navigation"
) => {
  try {
    // If iconKey already has "Icon" prefix, use it directly
    // Otherwise, get the mapped icon name
    const tablerIconName = iconKey.startsWith("Icon") ? iconKey : getTablerIcon(iconKey);
    return <Icon name={tablerIconName} size="tab" variant={variant} />;
  } catch (error) {
    return <Icon name="menu" size="tab" variant={variant} />;
  }
};

interface PopoverState {
  activePopover: string | null;
  popoverPosition: { top: number; left: number; item: MenuItem } | null;
  isPopoverAnimating: boolean;
  nestedPopover: string | null;
  nestedPopoverPosition: { top: number; left: number; item: MenuItem } | null;
  isNestedPopoverAnimating: boolean;
}

// @ts-expect-error TS6133 - Unused state structure defined for future popover implementation
const _initialPopoverState: PopoverState = {
  activePopover: null,
  popoverPosition: null,
  isPopoverAnimating: false,
  nestedPopover: null,
  nestedPopoverPosition: null,
  isNestedPopoverAnimating: false,
};

// Consistent spacing system
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Helper functions for complex style calculations - UPDATED to use green-700
// @ts-expect-error TS6133 - Unused but may be needed for future styling updates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _getMenuItemBackgroundColor = (isActive: boolean, pressed: boolean, isInPath: boolean, isDarkMode: boolean): string => {
  if (isActive) {
    if (DEBUG_STYLES) console.log("Active item - returning green-700 background");
    return "#15803d"; // green-700 - web primary
  }
  if (pressed) return isDarkMode ? "rgba(46, 46, 46, 0.5)" : "rgba(245, 245, 245, 0.5)"; // neutral-800/50 : neutral-100/50
  if (isInPath) return isDarkMode ? "rgba(21, 128, 61, 0.15)" : "rgba(21, 128, 61, 0.1)";
  return "transparent";
};

// @ts-expect-error TS6133 - Unused but may be needed for future styling updates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _getMenuItemBorderColor = (isInPath: boolean, isDarkMode: boolean): string => {
  return isInPath ? (isDarkMode ? "rgba(21, 128, 61, 0.4)" : "rgba(21, 128, 61, 0.3)") : "transparent";
};

// @ts-expect-error TS6133 - Unused but may be needed for future styling updates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _getIconColor = (isActive: boolean, isInPath: boolean, isDarkMode: boolean): string => {
  if (isActive) return "#fafafa"; // neutral-50
  if (isInPath) return "#15803d"; // green-700
  return isDarkMode ? "#cccccc" : "#525252"; // neutral-300 : neutral-600
};

const getPressedBackgroundColor = (isDarkMode: boolean): string => {
  return isDarkMode ? "rgba(46, 46, 46, 0.5)" : "rgba(245, 245, 245, 0.5)"; // neutral-800/50 : neutral-100/50
};

// Development-only style debugging tools
const DEBUG_STYLES = __DEV__;

// @ts-expect-error TS6133 - Unused but may be needed for development debugging
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _debugStyleIssues = (componentName: string, styles: Record<string, unknown>) => {
  if (!DEBUG_STYLES) return;

  // Check for common style issues
  if (styles.backgroundColor === "transparent" && styles.borderWidth && Number(styles.borderWidth) > 0) {
    console.warn(`[${componentName}] Border without background might be invisible`);
  }

  if (styles.position === "absolute" && !styles.top && !styles.bottom && !styles.left && !styles.right) {
    console.warn(`[${componentName}] Absolute positioning without positioning properties`);
  }

  if (styles.flex && styles.width) {
    console.warn(`[${componentName}] Using both flex and width might cause layout issues`);
  }
};

// Create styles outside component for better performance
const createStyles = (isDarkMode: boolean) => {
  const colors = {
    // Background colors - EXACTLY matching web sidebar (web --sidebar-background)
    background: isDarkMode ? "#212121" : "#fafafa", // neutral-850 : neutral-50 - web sidebar
    foreground: isDarkMode ? "#cccccc" : "#525252", // neutral-300 : neutral-600 - web sidebar-foreground

    // Card and surface colors - matching web card colors
    card: isDarkMode ? "#262626" : "#fafafa", // neutral-825 : neutral-50
    cardHover: isDarkMode ? "#2e2e2e" : "#f5f5f5", // neutral-800 : neutral-100

    // Text colors - EXACTLY matching web
    text: isDarkMode ? "#d4d4d4" : "#404040", // neutral-250 : neutral-700
    itemText: isDarkMode ? "#cccccc" : "#525252", // neutral-300 : neutral-600 - sidebar text
    muted: isDarkMode ? "#8c8c8c" : "#737373", // neutral-450 : neutral-500

    // Border and surface colors - EXACTLY matching web sidebar
    border: isDarkMode ? "#333333" : "#e5e5e5", // neutral-800 : neutral-150 - web sidebar-border
    hover: isDarkMode ? "rgba(46, 46, 46, 0.5)" : "rgba(245, 245, 245, 0.5)", // neutral-800/50 : neutral-100/50

    // Active states - EXACTLY matching web with green-700 (#15803d)
    active: "#15803d", // green-700 - web --primary (HSL: 142 72% 29%)
    activeText: "#fafafa", // neutral-50 - high contrast on green
    activeTextSecondary: isDarkMode ? "#dcfce7" : "#14532d", // green-100 : green-900
    activePath: isDarkMode ? "rgba(21, 128, 61, 0.15)" : "rgba(21, 128, 61, 0.1)",
    activePathBorder: isDarkMode ? "rgba(21, 128, 61, 0.4)" : "rgba(21, 128, 61, 0.3)",

    // Destructive colors - matching web
    destructive: isDarkMode ? "#b91c1c" : "#ef4444", // red-700 : red-500
    destructiveHover: isDarkMode ? "rgba(127, 29, 29, 0.3)" : "#fef2f2", // red-950/30 : red-50
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 64, // Changed from fixed height to minHeight
    },
    headerContent: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: 64,
      justifyContent: "center",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    themeToggleContainer: {
      flexShrink: 0,
      marginLeft: SPACING.sm,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      borderRadius: 8,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      minWidth: 0, // Ensures text truncation works
      maxWidth: "85%", // Prevent overflow
    },
    userAvatar: {
      width: 32,
      height: 32,
      backgroundColor: colors.active,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
      flexShrink: 0, // Prevents avatar from shrinking
    },
    userAvatarText: {
      color: colors.activeText,
      fontWeight: "bold",
      fontSize: 16,
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      justifyContent: "center",
    },
    userName: {
      fontWeight: "600",
      fontSize: 14,
      color: colors.text, // Use the theme colors
      lineHeight: 18,
    },
    userDetail: {
      fontSize: 12,
      color: colors.muted, // Use the theme colors
      marginTop: 2,
      lineHeight: 16,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xl,
    },
    menuItem: {
      marginBottom: SPACING.xs,
    },
    menuItemPressable: {
      borderRadius: 8,
      minHeight: 44, // Minimum touch target
      overflow: "hidden", // Ensure border radius is respected
    },
    menuItemPressableActive: {
      backgroundColor: colors.active, // green-700
    },
    menuItemPressableInPath: {
      backgroundColor: colors.activePath,
      borderWidth: 1,
      borderColor: colors.activePathBorder,
    },
    menuItemInner: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minHeight: 44, // Ensure consistent height
    },
    menuItemContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingVertical: SPACING.md, // Increased for better centering
      paddingLeft: SPACING.md,
      paddingRight: SPACING.xs,
    },
    menuItemIcon: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },
    menuItemText: {
      fontSize: 14,
      fontWeight: "500", // Slightly bolder for better readability
      color: colors.itemText,
      flex: 1,
      lineHeight: 20, // Better line height for readability
      letterSpacing: 0.1, // Slight letter spacing for clarity
    },
    menuItemTextActive: {
      fontWeight: "600",
      color: colors.activeText, // White text on green background
    },
    menuItemTextInPath: {
      fontWeight: "600",
      color: colors.active, // Green text for path indication
    },
    chevronContainer: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.xs,
    },
    chevronTouchable: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    contextualBadge: {
      backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.1)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: SPACING.sm,
    },
    contextualBadgeText: {
      fontSize: 10,
      color: colors.active, // green-700
      fontWeight: "600",
    },
    submenu: {
      marginTop: SPACING.xs,
    },
    footer: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.lg,
      width: "100%",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: 8,
      minHeight: 48,
      backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
      gap: SPACING.sm,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.destructive,
      lineHeight: 20,
    },
    // Enhanced user dropdown positioning with better safe area handling
    userDropdown: {
      position: "absolute",
      left: SPACING.md,
      right: SPACING.md,
      backgroundColor: isDarkMode ? "rgba(33, 33, 33, 0.98)" : "rgba(250, 250, 250, 0.98)", // neutral-850 : neutral-50 with opacity
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(51, 51, 51, 0.8)" : "rgba(229, 229, 229, 0.8)", // neutral-800 : neutral-150 with opacity
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDarkMode ? 0.4 : 0.15,
      shadowRadius: 20,
      elevation: 16,
      zIndex: 1000,
    },
    userDropdownContent: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.xs,
    },
    userDropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: 16,
      minHeight: 56,
      borderRadius: 8,
      marginHorizontal: SPACING.xs,
      marginVertical: 2,
    },
    userDropdownIcon: {
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
      opacity: 0.8,
    },
    userDropdownText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.itemText,
      letterSpacing: 0.25,
      // Fixed Y alignment for dropdown text
      lineHeight: 20,
      textAlignVertical: "center",
      includeFontPadding: false,
    },
  });
};

/**
 * Custom drawer content that mirrors the web sidebar structure
 */
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { favorites, showFavorites, toggleShowFavorites, isFavorite, toggleFavorite } = useFavorites();
  const { isDark, theme } = useTheme();
  const router = useRouter();

  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navigatingItemId, setNavigatingItemId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Theme detection
  const isDarkMode = theme === "dark" || (theme === "system" && isDark);
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  if (DEBUG_STYLES) {
    console.log(`Theme: ${theme}, isDark: ${isDark}, isDarkMode: ${isDarkMode}`);
  }

  // Animation values for chevrons
  const chevronAnimations = useRef(new Map<string, Animated.Value>());

  // Get current path info for contextual menu items
  const getCurrentPathInfo = useMemo(() => {
    const currentPath = pathname;

    // Check if we're on an edit or details page
    const editMatch = currentPath.match(/\/editar\/([^/]+)/);
    const detailsMatch = currentPath.match(/\/detalhes\/([^/]+)/);

    if (editMatch) {
      return {
        action: "editar" as const,
        entityId: editMatch[1],
        basePath: currentPath.replace(/\/editar\/[^/]+.*$/, ""),
      };
    }

    if (detailsMatch) {
      return {
        action: "detalhes" as const,
        entityId: detailsMatch[1],
        basePath: currentPath.replace(/\/detalhes\/[^/]+.*$/, ""),
      };
    }

    return null;
  }, [pathname]);

  // Add contextual menu items based on current route
  const addContextualMenuItems = useCallback(
    (menuItems: MenuItem[]): MenuItem[] => {
      if (!getCurrentPathInfo) return menuItems;

      const { action, entityId, basePath } = getCurrentPathInfo;

      return menuItems.map((item) => {
        // Check if this menu item or its children match the current base path
        const matchesBasePath = (menuItem: MenuItem): boolean => {
          if (menuItem.path && basePath.startsWith(menuItem.path)) return true;
          if (menuItem.children) {
            return menuItem.children.some((child) => matchesBasePath(child));
          }
          return false;
        };

        if (matchesBasePath(item) && item.children) {
          const enhancedChildren = [...item.children];

          // Add contextual items based on current action
          if (action === "editar") {
            const detalhesItem = {
              id: `${item.id}-detalhes-contextual`,
              title: "Detalhes",
              icon: "eye",
              path: `${basePath}/detalhes/${entityId}`,
              isContextual: true,
            };

            const listarIndex = enhancedChildren.findIndex((child) => child.id.includes("listar") || child.path?.endsWith("/listar"));
            const insertIndex = listarIndex !== -1 ? listarIndex + 1 : 0;
            enhancedChildren.splice(insertIndex, 0, detalhesItem);
          }

          if (action === "detalhes") {
            const editarItem = {
              id: `${item.id}-editar-contextual`,
              title: "Editar",
              icon: "edit",
              path: `${basePath}/editar/${entityId}`,
              isContextual: true,
            };

            const listarIndex = enhancedChildren.findIndex((child) => child.id.includes("listar") || child.path?.endsWith("/listar"));
            const insertIndex = listarIndex !== -1 ? listarIndex + 1 : 0;
            enhancedChildren.splice(insertIndex, 0, editarItem);
          }

          return {
            ...item,
            children: enhancedChildren.map((child) => (child.children ? addContextualMenuItems([child])[0] : child)),
          };
        }

        return item.children ? { ...item, children: addContextualMenuItems(item.children) } : item;
      });
    },
    [getCurrentPathInfo],
  );

  // Get or create animation value for chevron
  const getChevronAnimation = useCallback((itemId: string) => {
    if (!chevronAnimations.current.has(itemId)) {
      chevronAnimations.current.set(itemId, new Animated.Value(0));
    }
    return chevronAnimations.current.get(itemId)!;
  }, []);

  // Filter out dynamic menu items, cadastrar pages, and batch edit pages
  const filterOutDynamicAndCadastrarItems = useCallback(
    (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          // Skip dynamic items entirely
          if (item.isDynamic) {
            return null;
          }

          // Skip cadastrar pages (except when we're currently on one)
          if (item.id && item.id.includes("cadastrar") && !pathname.includes("cadastrar")) {
            return null;
          }

          // Skip batch edit pages (editar-em-lote) as they're only available on web
          if (item.id && item.id.includes("editar-em-lote")) {
            return null;
          }

          // If item has children, recursively filter them
          if (item.children && item.children.length > 0) {
            const filteredChildren = filterOutDynamicAndCadastrarItems(item.children);
            // Only return item if it has remaining children after filtering
            if (filteredChildren.length > 0) {
              return {
                ...item,
                children: filteredChildren,
              };
            }
            // If all children were filtered out, check if this item has its own path
            // If it does, keep it as a standalone item without children
            if (item.path) {
              return {
                ...item,
                children: [],
              };
            }
            // Otherwise, filter out this item too
            return null;
          }

          // Item has no children and is not dynamic, keep it
          return item;
        })
        .filter((item): item is MenuItem => item !== null); // Remove null items
    },
    [pathname],
  );

  // Memoized filtered menu with contextual items
  const filteredMenu = useMemo(() => {
    // Always return at least the home item as fallback
    const homeFallback = [
      {
        id: "home",
        title: "Início",
        path: routes.home,
        icon: "home",
      },
    ];

    if (!user) {
      console.log("[MENU] No user found for menu filtering, showing home only");
      return homeFallback;
    }

    console.log("[MENU] Filtering menu for user:", user?.name, "with privilege:", user?.sector?.privileges || user?.position?.sector?.privileges);

    const baseMenu = getFilteredMenuForUser(MENU_ITEMS, user as any, "mobile");
    console.log("[MENU] Base menu after privilege filtering:", baseMenu.length, "items", baseMenu.map(m => m.id));

    const menuWithContextual = addContextualMenuItems(baseMenu);
    console.log("[MENU] Menu with contextual items:", menuWithContextual.length, "items");

    const menuWithoutDynamicAndCadastrar = filterOutDynamicAndCadastrarItems(menuWithContextual);
    console.log("[MENU] Final menu after filtering dynamic/cadastrar:", menuWithoutDynamicAndCadastrar.length, "items");

    // If no menu items after filtering, return home fallback
    if (menuWithoutDynamicAndCadastrar.length === 0) {
      console.log("[MENU] No items after filtering, returning home fallback");
      return homeFallback;
    }

    return menuWithoutDynamicAndCadastrar;
  }, [user, addContextualMenuItems, filterOutDynamicAndCadastrarItems]);

  // Auto-expand menus based on current path
  useEffect(() => {
    const newExpandedMenus: { [key: string]: boolean } = {};

    const findAndExpandPath = (items: any[], parentPath = "") => {
      for (const item of items) {
        if (item.path) {
          // Add (tabs) prefix to Portuguese path
          const menuPathWithTabs = `/(tabs)${item.path}`;

          // Check if current pathname starts with this menu path
          if (pathname.startsWith(menuPathWithTabs)) {
            newExpandedMenus[item.id] = true;

            if (item.children) {
              findAndExpandPath(item.children, item.path);
            }
          }
        } else if (item.children) {
          // Check children even if parent has no path
          for (const child of item.children) {
            if (child.path) {
              const childPathWithTabs = `/(tabs)${child.path}`;

              if (pathname.startsWith(childPathWithTabs)) {
                // Expand the parent if any child matches
                newExpandedMenus[item.id] = true;
                break;
              }
            }
          }
          findAndExpandPath(item.children, parentPath);
        }
      }
    };

    findAndExpandPath(filteredMenu);
    setExpandedMenus((prev) => ({ ...prev, ...newExpandedMenus }));

    // Initialize chevron animations for expanded menus
    setTimeout(() => {
      Object.entries(newExpandedMenus).forEach(([itemId, isExpanded]) => {
        if (isExpanded) {
          const animation = getChevronAnimation(itemId);
          animation.setValue(1);
        }
      });
    }, 100);
  }, [pathname, filteredMenu, getChevronAnimation]);

  const handleLogout = async () => {
    try {
      await logout();
      // Close the drawer after logout
      props.navigation?.closeDrawer?.();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Memoized submenu toggle with animation - IMPROVED accordion behavior
  const toggleSubmenu = useCallback(
    (itemId: string, event?: GestureResponderEvent) => {
      if (event) {
        event.stopPropagation();
      }

      setExpandedMenus((prev) => {
        const isCurrentlyExpanded = prev[itemId];
        const newExpanded = { ...prev };
        const animation = getChevronAnimation(itemId);

        // Animate chevron rotation for the clicked item
        Animated.timing(animation, {
          toValue: isCurrentlyExpanded ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (!isCurrentlyExpanded) {
          // If expanding this menu, find and close all sibling menus at the same level
          const findAndCloseSiblings = (items: MenuItem[], targetId: string, parentPath: string[] = []): boolean => {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];

              if (item.id === targetId) {
                // Found our target item, close its siblings at this level
                items.forEach((sibling) => {
                  if (sibling.id !== targetId && sibling.children && sibling.children.length > 0) {
                    if (newExpanded[sibling.id]) {
                      newExpanded[sibling.id] = false;
                      const siblingAnimation = getChevronAnimation(sibling.id);
                      Animated.timing(siblingAnimation, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }).start();
                    }
                  }
                });
                return true;
              }

              // Recursively search in children
              if (item.children && item.children.length > 0) {
                const foundInChildren = findAndCloseSiblings(item.children, targetId, [...parentPath, item.id]);
                if (foundInChildren) {
                  return true;
                }
              }
            }
            return false;
          };

          findAndCloseSiblings(filteredMenu, itemId);
        }

        // Toggle the clicked item
        newExpanded[itemId] = !isCurrentlyExpanded;

        return newExpanded;
      });
    },
    [filteredMenu, getChevronAnimation],
  );

  // Get first submenu path for direct navigation
  const getFirstSubmenuPath = (item: MenuItem): string | null => {
    // If item has a path, use it directly (for entities, this is the list view)
    if (item.path) return item.path;

    // If no path but has children, find first child with path
    if (item.children?.length) {
      const firstChild = item.children.find((child) => child.path);
      return firstChild?.path || null;
    }

    return null;
  };

  // Path navigation with error handling
  const navigateToPath = useCallback(
    (path: string) => {
      if (!path || typeof path !== "string" || path.trim() === "") {
        console.warn("No path provided for navigation");
        return;
      }

      // Use routeToMobilePath to add (tabs) prefix
      const tabRoute = routeToMobilePath(path);

      try {
        router.push(tabRoute as any);
        // Close the drawer after navigation
        props.navigation?.closeDrawer?.();
      } catch (error) {
        console.warn("Navigation failed for route:", tabRoute, error);
        // Try fallback to home
        try {
          router.push('/(tabs)/inicio' as any);
          props.navigation?.closeDrawer?.();
        } catch (fallbackError) {
          console.error("Fallback navigation also failed:", fallbackError);
        }
      }
    },
    [router, props.navigation],
  );

  // Check if menu item is active with path matching
  const isItemActive = useCallback(
    (item: MenuItem): boolean => {
      if (!item.path) return false;

      // Current pathname is like /(tabs)/inicio or /(tabs)/administracao/clientes
      // Remove (tabs) prefix from pathname for comparison
      const currentPath = pathname.replace(/^\/\(tabs\)/, "");

      // Normalize both paths for comparison
      const normalizedCurrent = normalizePath(currentPath);
      const normalizedItem = normalizePath(item.path);

      // Special case for home route
      if (item.path === "/" || normalizedItem === "") {
        return normalizedCurrent === "home" || normalizedCurrent === "";
      }

      // Exact path match
      if (normalizedCurrent === normalizedItem) {
        return true;
      }

      // For items with children, check if we're on a child route
      if (item.children && item.children.length > 0) {
        // Check if any child matches the current path
        const hasMatchingChild = item.children.some((child) => {
          if (!child.path) return false;
          const childNormalized = normalizePath(child.path);
          return normalizedCurrent === childNormalized ||
                 normalizedCurrent.startsWith(childNormalized + "/");
        });

        // If we're on a child route, highlight the parent
        if (hasMatchingChild) {
          return true;
        }
      }

      // Check if current path starts with the item's path (for parent highlighting)
      if (normalizedCurrent.startsWith(normalizedItem + "/")) {
        return true;
      }

      return false;
    },
    [pathname],
  );

  // Main item click handler with immediate visual feedback
  const handleMainItemClick = useCallback(
    (item: MenuItem) => {
      // Set loading state immediately for instant visual feedback
      setNavigatingItemId(item.id);

      // Use requestAnimationFrame to ensure the state update is rendered before navigation
      requestAnimationFrame(() => {
        // Navigate to the item's path or first child
        const targetPath = getFirstSubmenuPath(item);
        if (targetPath) {
          navigateToPath(targetPath);
        }

        // Clear loading state after a visible delay
        setTimeout(() => setNavigatingItemId(null), 800);
      });
    },
    [navigateToPath, getFirstSubmenuPath],
  );

  // Check if item has active child
  const hasActiveChild = useCallback(
    (item: MenuItem): boolean => {
      if (!item.children) return false;

      // Remove (tabs) prefix from pathname for comparison

      return item.children.some((child) => {
        // Check if child is active
        if (isItemActive(child)) return true;

        // Check if child has path and current route starts with it
        if (child.path) {
          const childPathWithTabs = `/(tabs)${child.path}`;

          // Check for partial match (for nested routes like /detalhes/[id])
          if (pathname.startsWith(childPathWithTabs)) {
            return true;
          }
        }

        // Recursively check grandchildren
        return hasActiveChild(child);
      });
    },
    [isItemActive, pathname],
  );

  // Check if item is in active path (for parent items that aren't directly active)
  const isInActivePath = useCallback(
    (item: MenuItem): boolean => {
      if (isItemActive(item)) return false;
      return hasActiveChild(item);
    },
    [isItemActive, hasActiveChild],
  );

  // User menu handlers
  const handleUserMenuClick = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const handleUserMenuNavigation = useCallback(
    (routeConstant: string) => {
      if (!routeConstant || typeof routeConstant !== "string") {
        console.warn("Invalid route constant provided to handleUserMenuNavigation");
        setShowUserMenu(false);
        return;
      }

      try {
        // Remove leading slash and convert to expo router format
        let routePath = routeConstant.startsWith("/") ? routeConstant.slice(1) : routeConstant;

        // Add the (tabs) prefix for tab routes
        const tabRoute = `/(tabs)/${routePath}`;

        router.push(tabRoute as any);
        setShowUserMenu(false);
        // Close the drawer after navigation
        props.navigation?.closeDrawer?.();
      } catch (error) {
        console.error("User menu navigation failed:", error);
        setShowUserMenu(false);
        // Try fallback to home
        try {
          router.push(routeToMobilePath(routes.home) as any);
          props.navigation?.closeDrawer?.();
        } catch (fallbackError) {
          console.error("Fallback navigation also failed:", fallbackError);
        }
      }
    },
    [router, props.navigation],
  );

  // Timer ref for long press
  const longPressTimers = useRef(new Map<string, NodeJS.Timeout>());

  // Render menu item with proper styling and animations
  const renderMenuItem = useCallback(
    (item: MenuItem, level = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedMenus[item.id];
      const isActive = isItemActive(item);
      const isInPath = isInActivePath(item);
      const isNavigating = navigatingItemId === item.id;
      const chevronAnimation = hasChildren ? getChevronAnimation(item.id) : null;

      // Interpolate chevron rotation
      const chevronRotation = chevronAnimation?.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "90deg"],
      });

      // Calculate padding and margin for nested items to create hierarchy
      const paddingLeft = SPACING.md; // Keep padding constant for all levels
      // Domain items (level 0) flush left, submenus progressively indented to match favorites pattern
      const marginLeft = level === 0 ? SPACING.sm : SPACING.sm + SPACING.lg * level; // 8px for domain, 24px, 40px, 56px for submenus
      const marginRight = SPACING.sm; // Keep right margin consistent

      // Handle long press for direct navigation on parent items
      const handleLongPress = () => {
        if (hasChildren) {
          const targetPath = getFirstSubmenuPath(item);
          if (targetPath) {
            navigateToPath(targetPath);
          }
        }
      };

      // Handle press start for long press detection
      const handlePressIn = () => {
        if (hasChildren && !item.path) {
          const timer = setTimeout(() => {
            handleLongPress();
          }, 500); // 500ms for long press
          longPressTimers.current.set(item.id, timer);
        }
      };

      // Handle press end
      const handlePressOut = () => {
        const timer = longPressTimers.current.get(item.id);
        if (timer) {
          clearTimeout(timer);
          longPressTimers.current.delete(item.id);
        }
      };

      return (
        <View key={item.id} style={styles.menuItem}>
          <View
            style={[
              styles.menuItemPressable,
              { marginLeft, marginRight },
              isActive && {
                backgroundColor: "#15803d", // green-700 - web primary
              },
              !isActive && isInPath && {
                backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.15)" : "rgba(21, 128, 61, 0.1)",
                borderWidth: 1,
                borderColor: isDarkMode ? "rgba(21, 128, 61, 0.4)" : "rgba(21, 128, 61, 0.3)",
              },
            ]}
          >
            <Pressable
              onPress={() => {
                // For items with children and a path, navigate directly
                if (hasChildren && item.path) {
                  handleMainItemClick(item);
                } else if (!hasChildren) {
                  // For leaf items, navigate
                  handleMainItemClick(item);
                } else {
                  // For parent items without a path, just expand/collapse
                  toggleSubmenu(item.id);
                }
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onLongPress={handleLongPress}
              delayLongPress={500}
              style={({ pressed }) => ({
                flex: 1,
                transform: pressed || isNavigating ? [{ scale: 0.98 }] : [{ scale: 1 }],
                opacity: isNavigating ? 0.7 : 1,
                backgroundColor: (pressed || isNavigating) && !isActive
                  ? (isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)")
                  : "transparent",
              })}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityState={{ expanded: isExpanded, selected: isActive }}
            >
            <View style={styles.menuItemInner}>
              <View style={StyleSheet.flatten([styles.menuItemContent, { paddingLeft }])}>
                  <View style={styles.menuItemIcon}>{getIconComponentLocal(item.icon, isActive ? "onPrimary" : isInPath ? "primary" : "navigation")}</View>
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                      !isActive && isInPath && styles.menuItemTextInPath,
                      { fontSize: level === 0 ? 14 : 13 },
                      // FORCE: Always set text color inline to match web exactly
                      {
                        color: isActive ? "#fafafa" : isDarkMode ? "#cccccc" : "#525252",
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                  {item.isContextual && (
                    <View style={styles.contextualBadge}>
                      <Text style={styles.contextualBadgeText}>ATUAL</Text>
                    </View>
                  )}
                </View>

                {/* Favorite toggle button - only for items with paths */}
                {item.path && !item.isContextual && (
                  <Pressable
                    onPress={async (e) => {
                      e.stopPropagation();
                      await toggleFavorite({
                        path: item.path!,
                        title: item.title,
                        icon: item.icon,
                      });
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: hasChildren ? 0 : SPACING.xs,
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isFavorite(item.path) ? (
                      <IconStarFilled size={16} color="#eab308" />
                    ) : (
                      <IconStar size={16} color={isActive ? "#fafafa" : isDarkMode ? "#cccccc" : "#525252"} opacity={0.5} />
                    )}
                  </Pressable>
                )}

                {hasChildren && (
                  <Pressable
                    onPress={(e) => {
                      toggleSubmenu(item.id, e);
                    }}
                    style={styles.chevronContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.chevronTouchable}>
                      {chevronAnimation && chevronRotation ? (
                        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                          <Icon name="chevron-right" size={16} variant={isActive ? "onPrimary" : isInPath ? "primary" : "navigation"} />
                        </Animated.View>
                      ) : (
                        <IconChevronRight size={16} color={isActive ? "#fafafa" : isInPath ? "#15803d" : isDarkMode ? "#cccccc" : "#525252"} />
                      )}
                    </View>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </View>

          {/* Submenu with smooth animation */}
          {hasChildren && isExpanded && (
            <View style={styles.submenu}>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </View>
          )}
        </View>
      );
    },
    [expandedMenus, navigatingItemId, styles, isDarkMode, isItemActive, isInActivePath, getChevronAnimation, toggleSubmenu, handleMainItemClick, navigateToPath, getFirstSubmenuPath, isFavorite, toggleFavorite],
  );

  return (
    <TouchableWithoutFeedback onPress={() => setShowUserMenu(false)}>
      <View style={[styles.container, { flex: 1, backgroundColor: isDarkMode ? "#212121" : "#fafafa" }]}>
        {/* Header Section - User Profile & Theme Toggle */}
        <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? Math.max(insets.top, 20) : Math.max(insets.top, 16) }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              {/* User Card - Clickable */}
              <Pressable
                onPress={handleUserMenuClick}
                style={({ pressed }) => [styles.userCard, pressed && { backgroundColor: getPressedBackgroundColor(isDarkMode) }]}
                accessibilityRole="button"
                accessibilityLabel="Menu do usuário"
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
                  </View>
                  <View
                    style={{
                      width: 200,
                      marginLeft: 4,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={StyleSheet.flatten([styles.userName, { color: isDarkMode ? "#d4d4d4" : "#404040" }])} numberOfLines={1}>
                      {user?.name || "Usuário"}
                    </Text>
                    <Text style={[styles.userDetail, { color: isDarkMode ? "#8c8c8c" : "#737373", marginTop: 2 }]} numberOfLines={1}>
                      {user?.email || (user?.phone && maskPhone(user?.phone)) || "Email/Phone"}
                    </Text>
                  </View>
                </View>
              </Pressable>

              <View style={styles.themeToggleContainer}>
                <ThemeToggle size={22} />
              </View>
            </View>
          </View>
        </View>

        {/* Main navigation area */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <View style={{ marginBottom: SPACING.xs }}>
              {/* Favorites Header - matching menu item design */}
              <View style={[styles.menuItem]}>
                <Pressable
                  onPress={toggleShowFavorites}
                  style={({ pressed }) => [
                    styles.menuItemPressable,
                    { marginLeft: SPACING.sm, marginRight: SPACING.sm },
                    pressed && {
                      backgroundColor: isDarkMode ? "rgba(46, 46, 46, 0.5)" : "rgba(245, 245, 245, 0.5)",
                    },
                  ]}
                >
                  <View style={styles.menuItemInner}>
                    <View style={[styles.menuItemContent, { paddingLeft: SPACING.md }]}>
                      <View style={styles.menuItemIcon}>
                        <IconStarFilled size={20} color="#eab308" />
                      </View>
                      <Text
                        style={[
                          styles.menuItemText,
                          {
                            color: isDarkMode ? "#cccccc" : "#525252",
                            fontWeight: "600",
                          },
                        ]}
                      >
                        Favoritos
                      </Text>
                    </View>
                    <View style={styles.chevronContainer}>
                      <Animated.View
                        style={{
                          transform: [{ rotate: showFavorites ? "90deg" : "0deg" }],
                        }}
                      >
                        <IconChevronRight size={16} color={isDarkMode ? "#cccccc" : "#525252"} />
                      </Animated.View>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Favorites List - using same menu item styling */}
              {showFavorites && (
                <View style={styles.submenu}>
                  {favorites.map((favorite) => {
                    // Check if this favorite is the current page
                    const currentPath = pathname.replace(/^\/\(tabs\)/, "");
                    const isFavoriteActive = currentPath === favorite.path;

                    return (
                      <View key={favorite.id} style={styles.menuItem}>
                        <View
                          style={[
                            styles.menuItemPressable,
                            { marginLeft: SPACING.sm + SPACING.lg, marginRight: SPACING.sm }, // Same as level 1 submenu indentation
                            isFavoriteActive && {
                              backgroundColor: "#15803d",
                            },
                          ]}
                        >
                          <Pressable
                            onPress={() => {
                              setNavigatingItemId(favorite.id);
                              navigateToPath(favorite.path);
                              setTimeout(() => setNavigatingItemId(null), 300);
                            }}
                            style={({ pressed }) => ({
                              flex: 1,
                              transform: pressed || navigatingItemId === favorite.id ? [{ scale: 0.98 }] : [{ scale: 1 }],
                              opacity: navigatingItemId === favorite.id ? 0.7 : 1,
                            })}
                          >
                            <View style={styles.menuItemInner}>
                              <View style={[styles.menuItemContent, { paddingLeft: SPACING.md }]}>
                                {favorite.icon && (
                                  <View style={styles.menuItemIcon}>
                                    {getIconComponentLocal(favorite.icon, isFavoriteActive ? "onPrimary" : "navigation")}
                                  </View>
                                )}
                                <Text
                                  style={[
                                    styles.menuItemText,
                                    {
                                      color: isFavoriteActive ? "#fafafa" : isDarkMode ? "#cccccc" : "#525252",
                                      fontSize: 13,
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {favorite.title}
                                </Text>
                              </View>
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: isDarkMode ? "#333333" : "#e5e5e5",
                  marginTop: SPACING.md,
                  marginBottom: SPACING.xs,
                  marginHorizontal: SPACING.md,
                }}
              />
            </View>
          )}

          {/* Menu items */}
          {filteredMenu.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: isDarkMode ? "#8c8c8c" : "#737373" }}>Nenhum item de menu disponível</Text>
            </View>
          ) : (
            filteredMenu.map((item) => renderMenuItem(item, 0))
          )}
        </ScrollView>

        {/* Footer Section - Logout Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 0) }]}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && {
                backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                transform: [{ scale: 0.98 }], // Subtle scale feedback
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sair do aplicativo"
            accessibilityHint="Faz logout e retorna à tela de login"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon name="logout" size={20} variant="error" />
              <Text style={styles.logoutText}>Sair</Text>
            </View>
          </Pressable>
        </View>

        {/* ENHANCED: User Dropdown Menu - Superior positioning with safe area handling */}
        {showUserMenu && (
          <View
            style={[
              styles.userDropdown,
              {
                // Enhanced calculation for dropdown position with proper safe area handling
                top: insets.top + 64, // Safe area + header height + small margin
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.userDropdownContent}>
                <Pressable
                  onPress={() => handleUserMenuNavigation(routes.personal.myProfile.root)}
                  style={({ pressed }) => [styles.userDropdownItem, pressed && { backgroundColor: getPressedBackgroundColor(isDarkMode) }]}
                  accessibilityRole="button"
                  accessibilityLabel="Meu Perfil"
                >
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 8 }}>
                    <Icon name="user" size={16} variant="default" />
                    <Text style={StyleSheet.flatten([styles.userDropdownText, { marginLeft: 12 }])}>Meu Perfil</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleUserMenuNavigation(routes.personal.preferences.root)}
                  style={({ pressed }) => [styles.userDropdownItem, pressed && { backgroundColor: getPressedBackgroundColor(isDarkMode) }]}
                  accessibilityRole="button"
                  accessibilityLabel="Configurações"
                >
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 8 }}>
                    <Icon name="settings" size={16} variant="default" />
                    <Text style={StyleSheet.flatten([styles.userDropdownText, { marginLeft: 12 }])}>Configurações</Text>
                  </View>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// Dynamic screen registration system
const getScreensToRegister = () => {
  // List of ONLY existing screens that need registration (using Portuguese file paths - matching actual folder structure)
  const existingScreens = [
    // Core screens
    { name: "inicio", title: "Início" },
    { name: "configuracoes", title: "Configurações" },
    { name: "meu-perfil", title: "Perfil" },

    // Admin
    { name: "admin/backup", title: "Backup" },

    // Dashboard Module
    { name: "painel", title: "Dashboard" },

    // Maintenance Module
    { name: "manutencao", title: "Manutenção" },
    { name: "manutencao/index", title: "Manutenção" },

    // Production Module
    { name: "producao", title: "Produção" },
    { name: "producao/index", title: "Produção" },
    { name: "producao/aerografia", title: "Aerografia" },
    { name: "producao/aerografia/index", title: "Aerografia" },
    { name: "producao/aerografia/cadastrar", title: "Cadastrar Aerografia" },
    { name: "producao/aerografia/detalhes/[id]", title: "Detalhes da Aerografia" },
    { name: "producao/aerografia/editar/[id]", title: "Editar Aerografia" },
    { name: "producao/aerografia/listar", title: "Listar Aerografias" },
    { name: "producao/cronograma", title: "Cronograma" },
    { name: "producao/cronograma/index", title: "Cronograma" },
    { name: "producao/cronograma/cadastrar", title: "Cronograma - Cadastrar" },
    { name: "producao/cronograma/detalhes/[id]", title: "Detalhes do Cronograma" },
    { name: "producao/cronograma/editar/[id]", title: "Editar Cronograma" },
    { name: "producao/cronograma/listar", title: "Listar Cronogramas" },
    { name: "producao/cronograma/on-hold", title: "Cronograma - Em Espera" },
    { name: "producao/historico", title: "Histórico" },
    { name: "producao/historico/index", title: "Histórico" },
    { name: "producao/historico/cancelled", title: "Histórico - Canceladas" },
    { name: "producao/historico/completed", title: "Histórico - Finalizadas" },
    { name: "producao/recorte", title: "Recorte" },
    { name: "producao/recorte/listar", title: "Listar Recortes" },
    { name: "producao/recorte/plano-de-recorte/cadastrar", title: "Criar Plano de Recorte" },
    { name: "producao/recorte/plano-de-recorte/detalhes/[id]", title: "Detalhes do Plano de Recorte" },
    { name: "producao/recorte/plano-de-recorte/editar/[id]", title: "Editar Plano de Recorte" },
    { name: "producao/recorte/plano-de-recorte/listar", title: "Listar Planos de Recorte" },
    { name: "producao/recorte/requisicao-de-recorte/cadastrar", title: "Criar Requisição de Recorte" },
    { name: "producao/recorte/requisicao-de-recorte/detalhes/[id]", title: "Detalhes da Requisição de Recorte" },
    { name: "producao/recorte/requisicao-de-recorte/editar/[id]", title: "Editar Requisição de Recorte" },
    { name: "producao/recorte/requisicao-de-recorte/listar", title: "Listar Requisições de Recorte" },
    { name: "producao/garagens", title: "Garagens" },
    { name: "producao/garagens/index", title: "Garagens" },
    { name: "producao/garagens/cadastrar", title: "Cadastrar Garagem" },
    { name: "producao/garagens/detalhes/[id]", title: "Detalhes da Garagem" },
    { name: "producao/garagens/editar/[id]", title: "Editar Garagem" },
    { name: "producao/garagens/listar", title: "Listar Garagens" },
    { name: "producao/observacoes", title: "Observações" },
    { name: "producao/observacoes/index", title: "Observações" },
    { name: "producao/observacoes/cadastrar", title: "Cadastrar Observação" },
    { name: "producao/observacoes/detalhes/[id]", title: "Detalhes da Observação" },
    { name: "producao/observacoes/editar/[id]", title: "Editar Observação" },
    { name: "producao/observacoes/listar", title: "Listar Observações" },
    { name: "producao/tintas/cadastrar", title: "Cadastrar Tinta" },
    { name: "producao/tintas/detalhes/[id]", title: "Detalhes da Tinta" },
    { name: "producao/tintas/editar/[id]", title: "Editar Tinta" },
    { name: "producao/tintas/listar", title: "Listar Tintas" },
    { name: "producao/ordens-de-servico/cadastrar", title: "Cadastrar Ordem de Serviço" },
    { name: "producao/ordens-de-servico/detalhes/[id]", title: "Detalhes da Ordem de Serviço" },
    { name: "producao/ordens-de-servico/editar/[id]", title: "Editar Ordem de Serviço" },
    { name: "producao/ordens-de-servico/listar", title: "Listar Ordens de Serviço" },
    { name: "producao/servicos", title: "Serviços" },
    { name: "producao/servicos/cadastrar", title: "Cadastrar Serviço" },
    { name: "producao/servicos/detalhes/[id]", title: "Detalhes do Serviço" },
    { name: "producao/servicos/editar/[id]", title: "Editar Serviço" },
    { name: "producao/servicos/listar", title: "Listar Serviços" },
    { name: "producao/caminhoes", title: "Caminhões" },
    { name: "producao/caminhoes/cadastrar", title: "Cadastrar Caminhão" },
    { name: "producao/caminhoes/detalhes/[id]", title: "Detalhes do Caminhão" },
    { name: "producao/caminhoes/editar/[id]", title: "Editar Caminhão" },
    { name: "producao/caminhoes/listar", title: "Listar Caminhões" },

    // Inventory Module
    { name: "estoque", title: "Estoque" },
    { name: "estoque/index", title: "Estoque" },
    { name: "estoque/movimentacoes", title: "Movimentações" },
    { name: "estoque/movimentacoes/index", title: "Movimentações" },
    { name: "estoque/movimentacoes/cadastrar", title: "Cadastrar Movimentação" },
    { name: "estoque/movimentacoes/detalhes/[id]", title: "Detalhes da Movimentação" },
    { name: "estoque/movimentacoes/editar/[id]", title: "Editar Movimentação" },
    { name: "estoque/movimentacoes/listar", title: "Listar Movimentações" },
    { name: "estoque/produtos", title: "Produtos" },
    { name: "estoque/produtos/index", title: "Produtos" },
    { name: "estoque/produtos/cadastrar", title: "Cadastrar Produto" },
    { name: "estoque/produtos/detalhes/[id]", title: "Detalhes do Produto" },
    { name: "estoque/produtos/editar/[id]", title: "Editar Produto" },
    { name: "estoque/produtos/listar", title: "Listar Produtos" },
    { name: "estoque/produtos/categorias", title: "Categorias" },
    { name: "estoque/produtos/categorias/cadastrar", title: "Cadastrar Categoria" },
    { name: "estoque/produtos/categorias/detalhes/[id]", title: "Detalhes da Categoria" },
    { name: "estoque/produtos/categorias/editar/[id]", title: "Editar Categoria" },
    { name: "estoque/produtos/categorias/listar", title: "Listar Categorias" },
    { name: "estoque/produtos/marcas", title: "Marcas" },
    { name: "estoque/produtos/marcas/cadastrar", title: "Cadastrar Marca" },
    { name: "estoque/produtos/marcas/detalhes/[id]", title: "Detalhes da Marca" },
    { name: "estoque/produtos/marcas/editar/[id]", title: "Editar Marca" },
    { name: "estoque/produtos/marcas/listar", title: "Listar Marcas" },
    { name: "estoque/fornecedores", title: "Fornecedores" },
    { name: "estoque/fornecedores/index", title: "Fornecedores" },
    { name: "estoque/fornecedores/cadastrar", title: "Cadastrar Fornecedor" },
    { name: "estoque/fornecedores/detalhes/[id]", title: "Detalhes do Fornecedor" },
    { name: "estoque/fornecedores/editar/[id]", title: "Editar Fornecedor" },
    { name: "estoque/fornecedores/listar", title: "Listar Fornecedores" },
    { name: "estoque/pedidos", title: "Pedidos" },
    { name: "estoque/pedidos/index", title: "Pedidos" },
    { name: "estoque/pedidos/cadastrar", title: "Cadastrar Pedido" },
    { name: "estoque/pedidos/detalhes/[id]", title: "Detalhes do Pedido" },
    { name: "estoque/pedidos/editar/[id]", title: "Editar Pedido" },
    { name: "estoque/pedidos/listar", title: "Listar Pedidos" },
    { name: "estoque/pedidos/[orderId]/items/listar", title: "Itens do Pedido" },
    { name: "estoque/pedidos/automaticos", title: "Pedidos Automáticos" },
    { name: "estoque/pedidos/automaticos/index", title: "Pedidos Automáticos" },
    { name: "estoque/pedidos/automaticos/configure", title: "Configurar Pedidos Automáticos" },
    { name: "estoque/pedidos/automaticos/listar", title: "Listar Pedidos Automáticos" },
    { name: "estoque/pedidos/agendamentos", title: "Agendamentos" },
    { name: "estoque/pedidos/agendamentos/index", title: "Agendamentos" },
    { name: "estoque/pedidos/agendamentos/cadastrar", title: "Cadastrar Agendamento" },
    { name: "estoque/pedidos/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento" },
    { name: "estoque/pedidos/agendamentos/editar/[id]", title: "Editar Agendamento" },
    { name: "estoque/pedidos/agendamentos/listar", title: "Listar Agendamentos" },
    { name: "estoque/manutencao", title: "Manutenção" },
    { name: "estoque/manutencao/index", title: "Manutenção" },
    { name: "estoque/manutencao/cadastrar", title: "Cadastrar Manutenção" },
    { name: "estoque/manutencao/detalhes/[id]", title: "Detalhes da Manutenção" },
    { name: "estoque/manutencao/editar/[id]", title: "Editar Manutenção" },
    { name: "estoque/manutencao/listar", title: "Listar Manutenções" },
    { name: "estoque/manutencao/agendamentos", title: "Agendamentos de Manutenção" },
    { name: "estoque/retiradas-externas", title: "Retiradas Externas" },
    { name: "estoque/retiradas-externas/index", title: "Retiradas Externas" },
    { name: "estoque/retiradas-externas/cadastrar", title: "Cadastrar Retirada Externa" },
    { name: "estoque/retiradas-externas/detalhes/[id]", title: "Detalhes da Retirada Externa" },
    { name: "estoque/retiradas-externas/editar/[id]", title: "Editar Retirada Externa" },
    { name: "estoque/retiradas-externas/listar", title: "Listar Retiradas Externas" },
    { name: "estoque/epi", title: "EPI" },
    { name: "estoque/epi/index", title: "EPI" },
    { name: "estoque/epi/cadastrar", title: "Cadastrar PPE" },
    { name: "estoque/epi/detalhes/[id]", title: "Detalhes do PPE" },
    { name: "estoque/epi/editar/[id]", title: "Editar PPE" },
    { name: "estoque/epi/listar", title: "Listar PPEs" },
    { name: "estoque/epi/agendamentos", title: "Agendamentos EPI" },
    { name: "estoque/epi/agendamentos/index", title: "Agendamentos EPI" },
    { name: "estoque/epi/agendamentos/cadastrar", title: "Cadastrar Agendamento PPE" },
    { name: "estoque/epi/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento PPE" },
    { name: "estoque/epi/agendamentos/editar/[id]", title: "Editar Agendamento PPE" },
    { name: "estoque/epi/agendamentos/listar", title: "Listar Agendamentos PPE" },
    { name: "estoque/epi/entregas", title: "Entregas EPI" },
    { name: "estoque/epi/entregas/index", title: "Entregas EPI" },
    { name: "estoque/epi/entregas/cadastrar", title: "Criar Entrega de PPE" },
    { name: "estoque/epi/entregas/detalhes/[id]", title: "Detalhes da Entrega de PPE" },
    { name: "estoque/epi/entregas/editar/[id]", title: "Editar Entrega de PPE" },
    { name: "estoque/epi/entregas/listar", title: "Listar Entregas de PPE" },
    { name: "estoque/emprestimos", title: "Empréstimos" },
    { name: "estoque/emprestimos/index", title: "Empréstimos" },
    { name: "estoque/emprestimos/cadastrar", title: "Cadastrar Empréstimo" },
    { name: "estoque/emprestimos/detalhes/[id]", title: "Detalhes do Empréstimo" },
    { name: "estoque/emprestimos/editar/[id]", title: "Editar Empréstimo" },
    { name: "estoque/emprestimos/listar", title: "Listar Empréstimos" },
    { name: "estoque/reports", title: "Relatórios" },
    { name: "estoque/statistics", title: "Estatísticas" },

    // Painting Module
    { name: "pintura", title: "Pintura" },
    { name: "pintura/index", title: "Pintura" },
    { name: "pintura/catalogo", title: "Catálogo" },
    { name: "pintura/catalogo/index", title: "Catálogo" },
    { name: "pintura/catalogo/cadastrar", title: "Cadastrar Catálogo" },
    { name: "pintura/catalogo/detalhes/[id]", title: "Detalhes do Catálogo" },
    { name: "pintura/catalogo/editar/[id]", title: "Editar Catálogo" },
    { name: "pintura/catalogo/listar", title: "Listar Catálogos" },
    { name: "pintura/formulas", title: "Fórmulas" },
    { name: "pintura/formulas/cadastrar", title: "Criar Fórmula" },
    { name: "pintura/formulas/detalhes/[id]", title: "Detalhes da Fórmula" },
    { name: "pintura/formulas/editar/[id]", title: "Editar Fórmula" },
    { name: "pintura/formulas/listar", title: "Listar Fórmulas" },
    { name: "pintura/formulas/[formulaId]/componentes/listar", title: "Componentes da Fórmula" },
    { name: "pintura/marcas-de-tinta", title: "Marcas de Tinta" },
    { name: "pintura/marcas-de-tinta/index", title: "Marcas de Tinta" },
    { name: "pintura/marcas-de-tinta/cadastrar", title: "Cadastrar Marca de Tinta" },
    { name: "pintura/marcas-de-tinta/detalhes/[id]", title: "Detalhes da Marca de Tinta" },
    { name: "pintura/marcas-de-tinta/editar/[id]", title: "Editar Marca de Tinta" },
    { name: "pintura/marcas-de-tinta/listar", title: "Listar Marcas de Tinta" },
    { name: "pintura/tipos-de-tinta", title: "Tipos de Tinta" },
    { name: "pintura/tipos-de-tinta/index", title: "Tipos de Tinta" },
    { name: "pintura/tipos-de-tinta/cadastrar", title: "Cadastrar Tipo de Tinta" },
    { name: "pintura/tipos-de-tinta/detalhes/[id]", title: "Detalhes do Tipo de Tinta" },
    { name: "pintura/tipos-de-tinta/editar/[id]", title: "Editar Tipo de Tinta" },
    { name: "pintura/tipos-de-tinta/listar", title: "Listar Tipos de Tinta" },
    { name: "pintura/producoes", title: "Produções" },
    { name: "pintura/producoes/index", title: "Produções" },
    { name: "pintura/producoes/cadastrar", title: "Criar Produção" },
    { name: "pintura/producoes/detalhes/[id]", title: "Detalhes da Produção" },
    { name: "pintura/producoes/editar/[id]", title: "Editar Produção" },
    { name: "pintura/producoes/listar", title: "Listar Produções" },
    { name: "pintura/catalogo-basico", title: "Catálogo Básico" },
    { name: "pintura/catalogo-basico/index", title: "Catálogo Básico" },

    // Statistics Module
    { name: "estatisticas/estoque", title: "Estatísticas de Estoque" },
    { name: "estatisticas/estoque/index", title: "Estatísticas de Estoque" },

    // Administration Module
    { name: "administracao", title: "Administração" },
    { name: "administracao/index", title: "Administração" },
    { name: "administracao/colaboradores", title: "Colaboradores" },
    { name: "administracao/colaboradores/index", title: "Colaboradores" },
    { name: "administracao/colaboradores/cadastrar", title: "Cadastrar Colaborador" },
    { name: "administracao/colaboradores/detalhes/[id]", title: "Detalhes do Colaborador" },
    { name: "administracao/colaboradores/editar/[id]", title: "Editar Colaborador" },
    { name: "administracao/colaboradores/listar", title: "Listar Colaboradores" },
    { name: "administracao/clientes", title: "Clientes" },
    { name: "administracao/clientes/index", title: "Clientes" },
    { name: "administracao/clientes/cadastrar", title: "Cadastrar Cliente" },
    { name: "administracao/clientes/detalhes/[id]", title: "Detalhes do Cliente" },
    { name: "administracao/clientes/editar/[id]", title: "Editar Cliente" },
    { name: "administracao/clientes/listar", title: "Listar Clientes" },
    { name: "administracao/arquivos", title: "Arquivos" },
    { name: "administracao/arquivos/detalhes/[id]", title: "Detalhes do Arquivo" },
    { name: "administracao/arquivos/listar", title: "Listar Arquivos" },
    { name: "administracao/arquivos/orphans", title: "Arquivos Órfãos" },
    { name: "administracao/arquivos/upload", title: "Fazer Upload de Arquivo" },
    { name: "administracao/notificacoes", title: "Notificações" },
    { name: "administracao/notificacoes/index", title: "Notificações" },
    { name: "administracao/notificacoes/cadastrar", title: "Cadastrar Notificação" },
    { name: "administracao/notificacoes/create/enviar", title: "Enviar Notificação" },
    { name: "administracao/notificacoes/listar", title: "Listar Notificações" },
    { name: "administracao/setores", title: "Setores" },
    { name: "administracao/setores/index", title: "Setores" },
    { name: "administracao/setores/cadastrar", title: "Cadastrar Setor" },
    { name: "administracao/setores/detalhes/[id]", title: "Detalhes do Setor" },
    { name: "administracao/setores/editar/[id]", title: "Editar Setor" },
    { name: "administracao/setores/listar", title: "Listar Setores" },
    { name: "administracao/registros-de-alteracoes", title: "Registros de Alterações" },
    { name: "administracao/registros-de-alteracoes/detalhes/[id]", title: "Detalhes do Registro" },
    { name: "administracao/registros-de-alteracoes/entity/[entityType]/[entityId]", title: "Registros por Entidade" },
    { name: "administracao/registros-de-alteracoes/listar", title: "Listar Registros de Alterações" },

    // Server Module
    { name: "servidor", title: "Servidor" },
    { name: "servidor/index", title: "Servidor" },
    { name: "servidor/backups", title: "Backups" },
    { name: "servidor/backups/cadastrar", title: "Criar Backup" },
    { name: "servidor/backups/detalhes/[id]", title: "Detalhes do Backup" },
    { name: "servidor/backups/listar", title: "Listar Backups" },
    { name: "servidor/registros-de-alteracoes", title: "Registros de Alterações" },
    { name: "servidor/registros-de-alteracoes/detalhes/[id]", title: "Detalhes do Registro" },
    { name: "servidor/registros-de-alteracoes/entity/[entityType]/[entityId]", title: "Registros por Entidade" },
    { name: "servidor/registros-de-alteracoes/listar", title: "Listar Registros de Alterações" },
    { name: "servidor/database-sync", title: "Sincronização de Banco de Dados" },
    { name: "servidor/implantacoes", title: "Implantações" },
    { name: "servidor/implantacoes/index", title: "Implantações" },
    { name: "servidor/implantacoes/detalhes/[id]", title: "Detalhes da Implantação" },
    { name: "servidor/implantacoes/listar", title: "Listar Implantações" },
    { name: "servidor/logs", title: "Logs do Servidor" },
    { name: "servidor/manutencao", title: "Manutenção do Servidor" },
    { name: "servidor/rate-limiting", title: "Limitação de Taxa" },
    { name: "servidor/resources", title: "Recursos do Servidor" },
    { name: "servidor/servicos", title: "Serviços" },
    { name: "servidor/shared-folders", title: "Pastas Compartilhadas" },
    { name: "servidor/status", title: "Status do Servidor" },
    { name: "servidor/system-users", title: "Usuários do Sistema" },
    { name: "servidor/usuarios", title: "Usuários" },
    { name: "servidor/usuarios/index", title: "Usuários" },
    { name: "servidor/registros-de-alteracoes/index", title: "Registros de Alterações" },

    // Human Resources Module
    { name: "recursos-humanos", title: "Recursos Humanos" },
    { name: "recursos-humanos/index", title: "Recursos Humanos" },
    { name: "recursos-humanos/funcionarios/cadastrar", title: "Cadastrar Funcionário" },
    { name: "recursos-humanos/funcionarios/detalhes/[id]", title: "Detalhes do Funcionário" },
    { name: "recursos-humanos/funcionarios/editar/[id]", title: "Editar Funcionário" },
    { name: "recursos-humanos/funcionarios/listar", title: "Listar Funcionários" },
    { name: "recursos-humanos/epi", title: "EPI" },
    { name: "recursos-humanos/epi/index", title: "EPI" },
    { name: "recursos-humanos/epi/cadastrar", title: "Cadastrar EPI" },
    { name: "recursos-humanos/epi/detalhes/[id]", title: "Detalhes do EPI" },
    { name: "recursos-humanos/epi/editar/[id]", title: "Editar EPI" },
    { name: "recursos-humanos/epi/listar", title: "Listar EPIs" },
    { name: "recursos-humanos/epi/entregas", title: "Entregas EPI" },
    { name: "recursos-humanos/epi/entregas/index", title: "Entregas EPI" },
    { name: "recursos-humanos/epi/entregas/cadastrar", title: "Cadastrar Entrega de EPI" },
    { name: "recursos-humanos/epi/entregas/detalhes/[id]", title: "Detalhes da Entrega de EPI" },
    { name: "recursos-humanos/epi/entregas/editar/[id]", title: "Editar Entrega de EPI" },
    { name: "recursos-humanos/epi/entregas/listar", title: "Listar Entregas de EPI" },
    { name: "recursos-humanos/epi/agendamentos", title: "Agendamentos EPI" },
    { name: "recursos-humanos/epi/agendamentos/index", title: "Agendamentos EPI" },
    { name: "recursos-humanos/epi/agendamentos/cadastrar", title: "Cadastrar Agendamento de EPI" },
    { name: "recursos-humanos/epi/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento de EPI" },
    { name: "recursos-humanos/epi/agendamentos/editar/[id]", title: "Editar Agendamento de EPI" },
    { name: "recursos-humanos/epi/agendamentos/listar", title: "Listar Agendamentos de EPI" },
    { name: "recursos-humanos/epi/tamanhos", title: "Tamanhos EPI" },
    { name: "recursos-humanos/epi/tamanhos/index", title: "Tamanhos EPI" },
    { name: "recursos-humanos/epi/sizes/cadastrar", title: "Cadastrar Tamanho de EPI" },
    { name: "recursos-humanos/epi/sizes/detalhes/[id]", title: "Detalhes do Tamanho de EPI" },
    { name: "recursos-humanos/epi/sizes/editar/[id]", title: "Editar Tamanho de EPI" },
    { name: "recursos-humanos/epi/sizes/listar", title: "Listar Tamanhos de EPI" },
    { name: "recursos-humanos/epi/relatorios", title: "Relatórios EPI" },
    { name: "recursos-humanos/epi/relatorios/index", title: "Relatórios EPI" },
    { name: "recursos-humanos/feriados", title: "Feriados" },
    { name: "recursos-humanos/feriados/index", title: "Feriados" },
    { name: "recursos-humanos/feriados/cadastrar", title: "Cadastrar Feriado" },
    { name: "recursos-humanos/feriados/detalhes/[id]", title: "Detalhes do Feriado" },
    { name: "recursos-humanos/feriados/editar/[id]", title: "Editar Feriado" },
    { name: "recursos-humanos/feriados/listar", title: "Listar Feriados" },
    { name: "recursos-humanos/feriados/calendar", title: "Calendário de Feriados" },
    { name: "recursos-humanos/ferias", title: "Férias" },
    { name: "recursos-humanos/ferias/index", title: "Férias" },
    { name: "recursos-humanos/avisos", title: "Advertências" },
    { name: "recursos-humanos/avisos/index", title: "Advertências" },
    { name: "recursos-humanos/folha-de-pagamento", title: "Folha de Pagamento" },
    { name: "recursos-humanos/folha-de-pagamento/cadastrar", title: "Criar Folha de Pagamento" },
    { name: "recursos-humanos/folha-de-pagamento/detalhes/[id]", title: "Detalhes da Folha de Pagamento" },
    { name: "recursos-humanos/folha-de-pagamento/editar/[id]", title: "Editar Folha de Pagamento" },
    { name: "recursos-humanos/folha-de-pagamento/listar", title: "Listar Folhas de Pagamento" },
    { name: "recursos-humanos/performance-levels", title: "Níveis de Desempenho" },
    { name: "recursos-humanos/niveis-de-desempenho/cadastrar", title: "Cadastrar Nível de Desempenho" },
    { name: "recursos-humanos/niveis-de-desempenho/detalhes/[id]", title: "Detalhes do Nível de Desempenho" },
    { name: "recursos-humanos/niveis-de-desempenho/editar/[id]", title: "Editar Nível de Desempenho" },
    { name: "recursos-humanos/niveis-de-desempenho/listar", title: "Listar Níveis de Desempenho" },
    { name: "recursos-humanos/cargos", title: "Cargos" },
    { name: "recursos-humanos/cargos/index", title: "Cargos" },
    { name: "recursos-humanos/cargos/cadastrar", title: "Cadastrar Cargo" },
    { name: "recursos-humanos/cargos/detalhes/[id]", title: "Detalhes do Cargo" },
    { name: "recursos-humanos/cargos/editar/[id]", title: "Editar Cargo" },
    { name: "recursos-humanos/cargos/listar", title: "Listar Cargos" },
    { name: "recursos-humanos/cargos/[positionId]/remunerations", title: "Remunerações do Cargo" },
    { name: "recursos-humanos/setores", title: "Setores" },
    { name: "recursos-humanos/setores/cadastrar", title: "Cadastrar Setor" },
    { name: "recursos-humanos/setores/detalhes/[id]", title: "Detalhes do Setor" },
    { name: "recursos-humanos/setores/editar/[id]", title: "Editar Setor" },
    { name: "recursos-humanos/setores/listar", title: "Listar Setores" },
    { name: "recursos-humanos/ferias/cadastrar", title: "Cadastrar Férias" },
    { name: "recursos-humanos/ferias/detalhes/[id]", title: "Detalhes das Férias" },
    { name: "recursos-humanos/ferias/listar", title: "Listar Férias" },
    { name: "recursos-humanos/ferias/calendar", title: "Calendário de Férias" },
    { name: "recursos-humanos/advertencias/cadastrar", title: "Cadastrar Advertência" },
    { name: "recursos-humanos/advertencias/detalhes/[id]", title: "Detalhes da Advertência" },
    { name: "recursos-humanos/advertencias/editar/[id]", title: "Editar Advertência" },
    { name: "recursos-humanos/advertencias/listar", title: "Listar Advertências" },

    // Personal Module
    { name: "pessoal", title: "Pessoal" },
    { name: "pessoal/my-profile", title: "Meu Perfil" },
    { name: "pessoal/my-holidays", title: "Meus Feriados" },
    { name: "pessoal/my-borrows", title: "Meus Empréstimos" },
    { name: "pessoal/my-borrows/detalhes/[id]", title: "Detalhes do Empréstimo" },
    { name: "pessoal/my-notifications", title: "Minhas Notificações" },
    { name: "pessoal/my-notifications/detalhes/[id]", title: "Detalhes da Notificação" },
    { name: "pessoal/my-ppes", title: "Meus EPIs" },
    { name: "pessoal/my-ppes/request", title: "Solicitar EPI" },
    { name: "pessoal/my-vacations", title: "Minhas Férias" },
    { name: "pessoal/my-vacations/detalhes/[id]", title: "Detalhes das Férias" },
    { name: "pessoal/my-warnings", title: "Meus Avisos" },
    { name: "pessoal/my-warnings/detalhes/[id]", title: "Detalhes do Aviso" },
    { name: "pessoal/preferences", title: "Preferências" },

    // Integrations Module
    { name: "integracoes", title: "Integrações" },
    { name: "integracoes/index", title: "Integrações" },
    { name: "integracoes/secullum", title: "Secullum" },
    { name: "integracoes/secullum/index", title: "Secullum" },
    { name: "integracoes/secullum/registros-ponto", title: "Registros de Ponto" },
    { name: "integracoes/secullum/registros-ponto/index", title: "Registros de Ponto" },
    { name: "integracoes/secullum/sync-status", title: "Status de Sincronização" },
    { name: "integracoes/secullum/calculations/listar", title: "Listar Cálculos" },
    { name: "integracoes/secullum/requests/listar", title: "Listar Requisições" },
    { name: "integracoes/secullum/time-entries/listar", title: "Listar Registros de Ponto" },
    { name: "integracoes/secullum/time-entries/detalhes/[id]", title: "Detalhes do Registro de Ponto" },

    // My Team Module (Meu Pessoal)
    { name: "meu-pessoal", title: "Meu Pessoal" },
    { name: "meu-pessoal/index", title: "Meu Pessoal" },
    { name: "meu-pessoal/emprestimos", title: "Empréstimos" },
    { name: "meu-pessoal/ferias", title: "Férias" },
    { name: "meu-pessoal/advertencias", title: "Avisos" },
  ];

  return existingScreens;
};

// Function to determine if back button should be shown based on navigation history
const shouldShowBackButton = (pathname: string, canGoBack: boolean): boolean => {
  // Don't show back button for home screen
  if (pathname === "/home") return false;

  // Don't show back button for auth screens (they have their own navigation)
  if (pathname.startsWith("/(autenticacao)")) return false;

  // Show back button if we can go back in navigation history
  return canGoBack;
};

function DrawerLayout() {
  const { isDark, theme } = useTheme();

  const pathname = usePathname();
  const { canGoBack, goBack } = useNavigationHistory();
  const insets = useSafeAreaInsets();

  const screensToRegister = getScreensToRegister();

  const isDarkMode = theme === "dark" || (theme === "system" && isDark);

  // Get screen dimensions for responsive drawer width
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth < 360 ? screenWidth * 0.85 : Math.min(320, screenWidth * 0.8);

  // Use EXACT colors to match web sidebar
  const drawerColors = {
    background: isDarkMode ? "#212121" : "#fafafa", // neutral-850 : neutral-50 - web sidebar
    headerBackground: isDarkMode ? "#212121" : "#fafafa", // neutral-850 : neutral-50 - web sidebar
    text: isDarkMode ? "#d4d4d4" : "#404040", // neutral-250 : neutral-700
    active: "#15803d", // green-700 for active items - web primary
    activeText: "#fafafa", // neutral-50 text on green background
  };

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: drawerColors.headerBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDarkMode ? "#333333" : "#e5e5e5", // neutral-800 : neutral-150 - web sidebar-border
        },
        headerTintColor: drawerColors.text,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerRightContainerStyle: {
          paddingRight: Math.max(16, insets.right + 8),
        },
        headerLeft: () => {
          if (!shouldShowBackButton(pathname, canGoBack)) return null;

          return (
            <Pressable
              onPress={() => {
                goBack();
              }}
              style={{
                marginLeft: 6,
                padding: 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Icon name="arrow-left" size="md" variant="default" />
            </Pressable>
          );
        },
        headerRight: () => (
          <Pressable
            onPress={() => {
              console.log('[MENU] Opening drawer');
              navigation.openDrawer();
            }}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 6,
              backgroundColor: pressed ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
            })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
          >
            <Icon name="menu" size="md" variant="default" />
          </Pressable>
        ),
        drawerPosition: "right",
        drawerStyle: {
          backgroundColor: drawerColors.background,
          width: drawerWidth,
        },
        drawerActiveTintColor: drawerColors.activeText,
        drawerActiveBackgroundColor: drawerColors.active,
        drawerInactiveTintColor: drawerColors.text,
      })}
    >
      {/* Dynamically register existing screens */}
      {screensToRegister.map((screen) => (
        <Drawer.Screen key={screen.name} name={screen.name} options={{ title: screen.title }} />
      ))}
    </Drawer>
  );
}

export default DrawerLayout;
