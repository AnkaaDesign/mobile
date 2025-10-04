// app/(tabs)/_layout.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Drawer } from "expo-router/drawer";
import { View, Text as RNText, Pressable, Platform, ScrollView, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from "react-native";
// Use React Native's Text directly to avoid theme overrides
const Text = RNText;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/icon-button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { IconChevronRight, IconLogout, IconUser, IconSettings, IconArrowLeft, IconMenu2 } from "@tabler/icons-react-native";
import { useRouter, useSegments, usePathname } from "expo-router";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { MENU_ITEMS, routes } from '../../constants';
import { getFilteredMenuForUser, getTablerIcon } from '../../utils/navigation';
import { getEnglishPath, routeToMobilePath } from "@/lib/route-mapper";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { maskPhone } from '../../utils';

// Enhanced icon rendering with standardized sizing and theming
const getIconComponentLocal = (iconKey: string, variant: string = "navigation") => {
  try {
    // If iconKey already has "Icon" prefix, use it directly
    // Otherwise, get the mapped icon name
    const tablerIconName = iconKey.startsWith("Icon") ? iconKey : getTablerIcon(iconKey);
    return <Icon name={tablerIconName} size="tab" variant={variant as any} />;
  } catch (error) {
    return <Icon name="menu" size="tab" variant={variant as any} />;
  }
};

interface PopoverState {
  activePopover: string | null;
  popoverPosition: { top: number; left: number; item: any } | null;
  isPopoverAnimating: boolean;
  nestedPopover: string | null;
  nestedPopoverPosition: { top: number; left: number; item: any } | null;
  isNestedPopoverAnimating: boolean;
}

const initialPopoverState: PopoverState = {
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

// Helper functions for complex style calculations
const getMenuItemBackgroundColor = (isActive: boolean, pressed: boolean, isInPath: boolean, isDarkMode: boolean): string => {
  if (isActive) {
    if (DEBUG_STYLES) console.log("Active item - returning green background");
    return "#16a34a"; // green-600
  }
  if (pressed) return isDarkMode ? "rgba(64, 64, 64, 0.5)" : "rgba(212, 212, 212, 0.5)"; // neutral-700/50 : neutral-300/50
  if (isInPath) return isDarkMode ? "rgba(22, 163, 74, 0.1)" : "rgba(22, 163, 74, 0.05)";
  return "transparent";
};

const getMenuItemBorderColor = (isInPath: boolean, isDarkMode: boolean): string => {
  return isInPath ? (isDarkMode ? "rgba(22, 163, 74, 0.3)" : "rgba(22, 163, 74, 0.2)") : "transparent";
};

const getIconColor = (isActive: boolean, isInPath: boolean, isDarkMode: boolean): string => {
  if (isActive) return "#f5f5f5";
  if (isInPath) return "#16a34a";
  return isDarkMode ? "#d4d4d4" : "#404040"; // neutral-300 : neutral-700
};

const getPressedBackgroundColor = (isDarkMode: boolean): string => {
  return isDarkMode ? "rgba(64, 64, 64, 0.5)" : "rgba(212, 212, 212, 0.5)"; // neutral-700/50 : neutral-300/50
};

// Development-only style debugging tools
const DEBUG_STYLES = __DEV__;

const debugStyleIssues = (componentName: string, styles: any) => {
  if (!DEBUG_STYLES) return;

  // Check for common style issues
  if (styles.backgroundColor === "transparent" && styles.borderWidth > 0) {
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
    // Background colors - Matching web sidebar exactly
    background: isDarkMode ? "#262626" : "#f5f5f5", // neutral-800 : neutral-100
    foreground: isDarkMode ? "#f5f5f5" : "#404040", // neutral-100 : neutral-700

    // Card and surface colors
    card: isDarkMode ? "#262626" : "#f5f5f5", // neutral-800 : neutral-100
    cardHover: isDarkMode ? "#404040" : "#e5e5e5", // neutral-700 : neutral-200

    // Text colors - Matching web
    text: isDarkMode ? "#f5f5f5" : "#404040", // neutral-100 : neutral-700
    itemText: isDarkMode ? "#d4d4d4" : "#404040", // neutral-300 : neutral-700
    muted: isDarkMode ? "#a3a3a3" : "#737373", // neutral-400 : neutral-500

    // Border and surface colors - Matching web
    border: isDarkMode ? "#404040" : "#d4d4d4", // neutral-700 : neutral-300
    hover: isDarkMode ? "rgba(64, 64, 64, 0.5)" : "rgba(212, 212, 212, 0.5)", // neutral-700/50 : neutral-300/50

    // Active states - Matching web
    active: "#16a34a", // green-600
    activeText: "#f5f5f5", // white - high contrast on green
    activeTextSecondary: isDarkMode ? "#dcfce7" : "#14532d", // Better contrast alternative
    activePath: isDarkMode ? "rgba(22, 163, 74, 0.15)" : "rgba(22, 163, 74, 0.1)",
    activePathBorder: isDarkMode ? "rgba(22, 163, 74, 0.4)" : "rgba(22, 163, 74, 0.3)",

    // Destructive colors
    destructive: isDarkMode ? "#f87171" : "#dc2626", // red-400 : red-600
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
      backgroundColor: colors.active, // green-600
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
      backgroundColor: isDarkMode ? "rgba(22, 163, 74, 0.2)" : "rgba(22, 163, 74, 0.1)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: SPACING.sm,
    },
    contextualBadgeText: {
      fontSize: 10,
      color: colors.active,
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
    },
    logoutIcon: {
      marginRight: SPACING.sm,
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
      backgroundColor: isDarkMode ? "rgba(38, 38, 38, 0.98)" : "rgba(245, 245, 245, 0.98)", // neutral-800 : neutral-100 with opacity
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(64, 64, 64, 0.8)" : "rgba(212, 212, 212, 0.8)", // neutral-700 : neutral-300 with opacity
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
  const { isDark, theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navigatingItemId, setNavigatingItemId] = useState<string | null>(null);
  const [popoverState, setPopoverState] = useState<PopoverState>(initialPopoverState);
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
    (menuItems: any[]): any[] => {
      if (!getCurrentPathInfo) return menuItems;

      const { action, entityId, basePath } = getCurrentPathInfo;

      return menuItems.map((item) => {
        // Check if this menu item or its children match the current base path
        const matchesBasePath = (menuItem: any): boolean => {
          if (menuItem.path && basePath.startsWith(menuItem.path)) return true;
          if (menuItem.children) {
            return menuItem.children.some((child: any) => matchesBasePath(child));
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
    (items: any[]): any[] => {
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
        .filter(Boolean); // Remove null items
    },
    [pathname],
  );

  // Memoized filtered menu with contextual items
  const filteredMenu = useMemo(() => {
    if (!user) {
      if (DEBUG_STYLES) {
        console.log("No user found for menu filtering");
      }
      return [];
    }

    const baseMenu = getFilteredMenuForUser(MENU_ITEMS, user as any, "mobile");
    const menuWithContextual = addContextualMenuItems(baseMenu);
    const menuWithoutDynamicAndCadastrar = filterOutDynamicAndCadastrarItems(menuWithContextual);

    // If no menu items after filtering, add at least home
    if (menuWithoutDynamicAndCadastrar.length === 0) {
      return [
        {
          id: "home",
          title: "Início",
          path: "/home",
          icon: "home",
        },
      ];
    }

    return menuWithoutDynamicAndCadastrar;
  }, [user, addContextualMenuItems, filterOutDynamicAndCadastrarItems]);

  // Auto-expand menus based on current path
  useEffect(() => {
    const newExpandedMenus: { [key: string]: boolean } = {};

    const findAndExpandPath = (items: any[], parentPath = "") => {
      for (const item of items) {
        if (item.path) {
          // Convert the Portuguese menu path to English and add (tabs) prefix
          const englishPath = getEnglishPath(item.path);
          const menuPathWithTabs = `/(tabs)${englishPath}`;

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
              const childEnglishPath = getEnglishPath(child.path);
              const childPathWithTabs = `/(tabs)${childEnglishPath}`;

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

  // Memoized submenu toggle with animation
  const toggleSubmenu = useCallback(
    (itemId: string, event?: any) => {
      if (event) {
        event.stopPropagation();
      }

      const isCurrentlyExpanded = expandedMenus[itemId as keyof typeof expandedMenus];
      const animation = getChevronAnimation(itemId);

      // Animate chevron rotation
      Animated.timing(animation, {
        toValue: isCurrentlyExpanded ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // If opening a new menu, close all others
      if (!isCurrentlyExpanded) {
        // Animate all other chevrons back to closed position
        Object.entries(expandedMenus).forEach(([id, isExpanded]) => {
          if (isExpanded && id !== itemId) {
            const otherAnimation = getChevronAnimation(id);
            Animated.timing(otherAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        });

        // Set the current menu as expanded while preserving others
        setExpandedMenus((prev) => ({ ...prev, [itemId]: true }));
      } else {
        // Just close the current menu
        setExpandedMenus((prev) => ({
          ...prev,
          [itemId]: false,
        }));
      }
    },
    [expandedMenus, getChevronAnimation],
  );

  // Get first submenu path for direct navigation
  const getFirstSubmenuPath = (item: any): string | null => {
    // If item has a path, use it directly (for entities, this is the list view)
    if (item.path) return item.path;

    // If no path but has children, find first child with path
    if (item.children?.length) {
      const firstChild = item.children.find((child: any) => child.path);
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

      // Convert Portuguese path to English file path
      const englishPath = getEnglishPath(path);

      // Remove leading slash and convert to expo router format
      let routePath = englishPath.startsWith("/") ? englishPath.slice(1) : englishPath;

      // Add the (tabs) prefix for tab routes
      const tabRoute = `/(tabs)/${routePath}`;

      try {
        router.push(tabRoute as any);
        // Close the drawer after navigation
        props.navigation?.closeDrawer?.();
      } catch (error) {
        console.warn("Navigation failed for route:", tabRoute, error);
        // Try fallback to home instead of undefined route
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

  // FIXED: Check if menu item is active with proper path matching
  const isItemActive = useCallback(
    (item: any): boolean => {
      if (!item.path) return false;

      // Current pathname is like /(tabs)/home or /(tabs)/personal/my-profile
      // Remove (tabs) prefix from pathname for comparison
      const currentPath = pathname.replace(/^\/\(tabs\)/, "");

      // Handle contextual menu items
      if (item.isContextual) {
        // For contextual items, get the English path from the item.path
        const englishPath = getEnglishPath(item.path);
        return currentPath === englishPath;
      }

      // Convert the Portuguese route constant (item.path) to English path
      const itemEnglishPath = getEnglishPath(item.path);

      // Special case for home route
      if (item.path === "/" || itemEnglishPath === "/") {
        // For home, check exact match with "/home" or root "/"
        return currentPath === "/home" || currentPath === "/" || currentPath === "";
      }

      // Exact path match
      if (currentPath === itemEnglishPath) {
        return true;
      }

      // For items with children, check if we're on a child route
      if (item.children && item.children.length > 0) {
        // Check if any child matches the current path
        const hasMatchingChild = item.children.some((child: any) => {
          if (!child.path) return false;
          const childEnglishPath = getEnglishPath(child.path);
          return currentPath === childEnglishPath || currentPath.startsWith(childEnglishPath + "/");
        });

        // If we're on a child route, highlight the parent
        if (hasMatchingChild) {
          return true;
        }
      }

      // Special case: highlight parent menu items for specific routes
      // Check if current path starts with the item's English path
      if (currentPath.startsWith(itemEnglishPath + "/")) {
        return true;
      }

      return false;
    },
    [pathname],
  );

  // Main item click handler
  const handleMainItemClick = useCallback(
    (item: any, event: any) => {
      event.preventDefault();
      event.stopPropagation();

      // Set loading state
      setNavigatingItemId(item.id);

      // Navigate to the item's path or first child
      const targetPath = getFirstSubmenuPath(item);
      if (targetPath) {
        navigateToPath(targetPath);
      }

      // Clear loading state after navigation
      setTimeout(() => setNavigatingItemId(null), 200);
    },
    [navigateToPath, getFirstSubmenuPath],
  );

  // Check if item has active child
  const hasActiveChild = useCallback(
    (item: any): boolean => {
      if (!item.children) return false;

      // Remove (tabs) prefix from pathname for comparison
      const currentPath = pathname.replace(/^\/\(tabs\)/, "");

      return item.children.some((child: any) => {
        // Check if child is active
        if (isItemActive(child)) return true;

        // Check if child has path and current route starts with it
        if (child.path) {
          const childEnglishPath = getEnglishPath(child.path);
          const childPathWithTabs = `/(tabs)${childEnglishPath}`;

          // Check for partial match (for nested routes like /details/[id])
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
    (item: any): boolean => {
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
        // Get the English path from the route constant
        const englishPath = getEnglishPath(routeConstant);

        // Remove leading slash and convert to expo router format
        let routePath = englishPath.startsWith("/") ? englishPath.slice(1) : englishPath;

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
    (item: any, level = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedMenus[item.id];
      const isActive = isItemActive(item);
      const isInPath = isInActivePath(item);
      const chevronAnimation = hasChildren ? getChevronAnimation(item.id) : null;

      // Interpolate chevron rotation
      const chevronRotation = chevronAnimation?.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "90deg"],
      });

      // Calculate padding and margin for nested items to create hierarchy
      const paddingLeft = SPACING.md; // Keep padding constant for all levels
      const marginLeft = SPACING.sm + level * SPACING.sm * 4; // Progressive indentation: 8px, 40px, 72px, etc.
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
              isActive
                ? {
                    backgroundColor: "#16a34a",
                    borderRadius: 8,
                  }
                : undefined,
              !isActive && isInPath
                ? {
                    backgroundColor: isDarkMode ? "rgba(22, 163, 74, 0.15)" : "rgba(22, 163, 74, 0.1)",
                    borderWidth: 1,
                    borderColor: isDarkMode ? "rgba(22, 163, 74, 0.4)" : "rgba(22, 163, 74, 0.3)",
                  }
                : undefined,
            ].filter(Boolean)}
          >
            <Pressable
              onPress={() => {
                // For items with children and a path, navigate directly
                if (hasChildren && item.path) {
                  handleMainItemClick(item, { preventDefault: () => {}, stopPropagation: () => {} });
                } else if (!hasChildren) {
                  // For leaf items, navigate
                  handleMainItemClick(item, { preventDefault: () => {}, stopPropagation: () => {} });
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
                transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
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
                      // FORCE: Always set text color inline
                      {
                        color: isActive ? "#f5f5f5" : isDarkMode ? "#e5e5e5" : "#1f2937",
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

                {hasChildren && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleSubmenu(item.id);
                    }}
                    style={styles.chevronContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.chevronTouchable}>
                      {chevronAnimation ? (
                        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                          <Icon name="chevron-right" size={16} variant={isActive ? "onPrimary" : isInPath ? "primary" : "navigation"} />
                        </Animated.View>
                      ) : (
                        <IconChevronRight size={16} color={isActive ? "#f5f5f5" : isInPath ? "#16a34a" : isDarkMode ? "#d4d4d4" : "#262626"} />
                      )}
                    </View>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </View>

          {/* Submenu with smooth animation */}
          {hasChildren && isExpanded && <View style={styles.submenu}>{item.children.map((child: any) => renderMenuItem(child, level + 1))}</View>}
        </View>
      );
    },
    [expandedMenus, styles, isDarkMode, isItemActive, isInActivePath, getChevronAnimation, toggleSubmenu, handleMainItemClick, navigateToPath, getFirstSubmenuPath],
  );

  return (
    <TouchableWithoutFeedback onPress={() => setShowUserMenu(false)}>
      <View style={[styles.container, { flex: 1, backgroundColor: isDarkMode ? "#262626" : "#f5f5f5" }]}>
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
                    <Text style={StyleSheet.flatten([styles.userName, { color: isDarkMode ? "#f5f5f5" : "#171717" }])} numberOfLines={1}>
                      {user?.name || "Usuário"}
                    </Text>
                    <Text style={[styles.userDetail, { color: isDarkMode ? "#a3a3a3" : "#737373", marginTop: 2 }]} numberOfLines={1}>
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
          {/* Menu items */}
          {filteredMenu.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: isDarkMode ? "#a3a3a3" : "#6b7280" }}>Nenhum item de menu disponível</Text>
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
              <Icon name="logout" size="md" variant="error" />
              <Text style={StyleSheet.flatten([styles.logoutText, { marginLeft: 8 }])}>Sair</Text>
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
  // List of ONLY existing screens that need registration (using English file paths)
  const existingScreens = [
    // Core screens
    { name: "home", title: "Início" },
    { name: "settings", title: "Configurações" },

    // Production Module
    { name: "production", title: "Produção" },
    { name: "production/schedule", title: "Cronograma" },
    { name: "production/schedule/create", title: "Cronograma - Cadastrar" },
    { name: "production/schedule/details/[id]", title: "Detalhes do Cronograma" },
    { name: "production/schedule/edit/[id]", title: "Editar Cronograma" },
    { name: "production/schedule/on-hold", title: "Cronograma - Em Espera" },
    { name: "production/history", title: "Histórico" },
    { name: "production/history/cancelled", title: "Histórico - Canceladas" },
    { name: "production/history/completed", title: "Histórico - Finalizadas" },
    { name: "production/cutting", title: "Recorte" },
    { name: "production/cutting/cutting-plan/create", title: "Criar Plano de Recorte" },
    { name: "production/cutting/cutting-plan/details/[id]", title: "Detalhes do Plano de Recorte" },
    { name: "production/cutting/cutting-plan/edit/[id]", title: "Editar Plano de Recorte" },
    { name: "production/cutting/cutting-plan/list", title: "Listar Planos de Recorte" },
    { name: "production/cutting/cutting-request/create", title: "Criar Requisição de Recorte" },
    { name: "production/cutting/cutting-request/details/[id]", title: "Detalhes da Requisição de Recorte" },
    { name: "production/cutting/cutting-request/edit/[id]", title: "Editar Requisição de Recorte" },
    { name: "production/cutting/cutting-request/list", title: "Listar Requisições de Recorte" },
    { name: "production/garages/create", title: "Cadastrar Garagem" },
    { name: "production/garages/details/[id]", title: "Detalhes da Garagem" },
    { name: "production/garages/edit/[id]", title: "Editar Garagem" },
    { name: "production/garages/list", title: "Listar Garagens" },
    { name: "production/observations/create", title: "Cadastrar Observação" },
    { name: "production/observations/details/[id]", title: "Detalhes da Observação" },
    { name: "production/observations/edit/[id]", title: "Editar Observação" },
    { name: "production/observations/list", title: "Listar Observações" },
    { name: "production/paints/create", title: "Cadastrar Tinta" },
    { name: "production/paints/details/[id]", title: "Detalhes da Tinta" },
    { name: "production/paints/edit/[id]", title: "Editar Tinta" },
    { name: "production/paints/list", title: "Listar Tintas" },
    { name: "production/service-orders/create", title: "Cadastrar Ordem de Serviço" },
    { name: "production/service-orders/details/[id]", title: "Detalhes da Ordem de Serviço" },
    { name: "production/service-orders/edit/[id]", title: "Editar Ordem de Serviço" },
    { name: "production/service-orders/list", title: "Listar Ordens de Serviço" },

    // Inventory Module
    { name: "inventory", title: "Estoque" },
    { name: "inventory/movements/create", title: "Cadastrar Movimentação" },
    { name: "inventory/movements/details/[id]", title: "Detalhes da Movimentação" },
    { name: "inventory/movements/edit/[id]", title: "Editar Movimentação" },
    { name: "inventory/movements/list", title: "Listar Movimentações" },
    { name: "inventory/products", title: "Produtos" },
    { name: "inventory/products/create", title: "Cadastrar Produto" },
    { name: "inventory/products/details/[id]", title: "Detalhes do Produto" },
    { name: "inventory/products/edit/[id]", title: "Editar Produto" },
    { name: "inventory/products/list", title: "Listar Produtos" },
    { name: "inventory/products/categories/create", title: "Cadastrar Categoria" },
    { name: "inventory/products/categories/details/[id]", title: "Detalhes da Categoria" },
    { name: "inventory/products/categories/edit/[id]", title: "Editar Categoria" },
    { name: "inventory/products/categories/list", title: "Listar Categorias" },
    { name: "inventory/products/brands/create", title: "Cadastrar Marca" },
    { name: "inventory/products/brands/details/[id]", title: "Detalhes da Marca" },
    { name: "inventory/products/brands/edit/[id]", title: "Editar Marca" },
    { name: "inventory/products/brands/list", title: "Listar Marcas" },
    { name: "inventory/suppliers/create", title: "Cadastrar Fornecedor" },
    { name: "inventory/suppliers/details/[id]", title: "Detalhes do Fornecedor" },
    { name: "inventory/suppliers/edit/[id]", title: "Editar Fornecedor" },
    { name: "inventory/suppliers/list", title: "Listar Fornecedores" },
    { name: "inventory/orders/create", title: "Cadastrar Pedido" },
    { name: "inventory/orders/details/[id]", title: "Detalhes do Pedido" },
    { name: "inventory/orders/edit/[id]", title: "Editar Pedido" },
    { name: "inventory/orders/list", title: "Listar Pedidos" },
    { name: "inventory/orders/automatic", title: "Pedidos Automáticos" },
    { name: "inventory/orders/automatic/configure", title: "Configurar Pedidos Automáticos" },
    { name: "inventory/orders/schedules/create", title: "Cadastrar Agendamento" },
    { name: "inventory/orders/schedules/details/[id]", title: "Detalhes do Agendamento" },
    { name: "inventory/orders/schedules/edit/[id]", title: "Editar Agendamento" },
    { name: "inventory/orders/schedules/list", title: "Listar Agendamentos" },
    { name: "inventory/maintenance/create", title: "Cadastrar Manutenção" },
    { name: "inventory/maintenance/details/[id]", title: "Detalhes da Manutenção" },
    { name: "inventory/maintenance/edit/[id]", title: "Editar Manutenção" },
    { name: "inventory/maintenance/list", title: "Listar Manutenções" },
    { name: "inventory/external-withdrawals/create", title: "Cadastrar Retirada Externa" },
    { name: "inventory/external-withdrawals/details/[id]", title: "Detalhes da Retirada Externa" },
    { name: "inventory/external-withdrawals/edit/[id]", title: "Editar Retirada Externa" },
    { name: "inventory/external-withdrawals/list", title: "Listar Retiradas Externas" },
    { name: "inventory/ppe/create", title: "Cadastrar PPE" },
    { name: "inventory/ppe/details/[id]", title: "Detalhes do PPE" },
    { name: "inventory/ppe/edit/[id]", title: "Editar PPE" },
    { name: "inventory/ppe/list", title: "Listar PPEs" },
    { name: "inventory/ppe/schedules/create", title: "Cadastrar Agendamento PPE" },
    { name: "inventory/ppe/schedules/details/[id]", title: "Detalhes do Agendamento PPE" },
    { name: "inventory/ppe/schedules/edit/[id]", title: "Editar Agendamento PPE" },
    { name: "inventory/ppe/schedules/list", title: "Listar Agendamentos PPE" },
    { name: "inventory/ppe/deliveries/create", title: "Criar Entrega de PPE" },
    { name: "inventory/ppe/deliveries/details/[id]", title: "Detalhes da Entrega de PPE" },
    { name: "inventory/ppe/deliveries/edit/[id]", title: "Editar Entrega de PPE" },
    { name: "inventory/ppe/deliveries/list", title: "Listar Entregas de PPE" },
    { name: "inventory/loans/create", title: "Cadastrar Empréstimo" },
    { name: "inventory/loans/details/[id]", title: "Detalhes do Empréstimo" },
    { name: "inventory/loans/edit/[id]", title: "Editar Empréstimo" },
    { name: "inventory/loans/list", title: "Listar Empréstimos" },
    { name: "inventory/loans/loans-temp/create", title: "Cadastrar Empréstimo Temporário" },
    { name: "inventory/loans/loans-temp/details/[id]", title: "Detalhes do Empréstimo Temporário" },
    { name: "inventory/loans/loans-temp/edit/[id]", title: "Editar Empréstimo Temporário" },
    { name: "inventory/loans/loans-temp/list", title: "Listar Empréstimos Temporários" },

    // Paint Module
    { name: "painting", title: "Pintura" },
    { name: "painting/catalog/create", title: "Cadastrar Catálogo" },
    { name: "painting/catalog/details/[id]", title: "Detalhes do Catálogo" },
    { name: "painting/catalog/edit/[id]", title: "Editar Catálogo" },
    { name: "painting/catalog/list", title: "Listar Catálogos" },
    { name: "painting/productions", title: "Produções" },
    { name: "painting/productions/details/[id]", title: "Detalhes da Produção" },
    { name: "painting/paint-types/create", title: "Cadastrar Tipo de Tinta" },
    { name: "painting/paint-types/details/[id]", title: "Detalhes do Tipo de Tinta" },
    { name: "painting/paint-types/edit/[id]", title: "Editar Tipo de Tinta" },
    { name: "painting/paint-types/list", title: "Listar Tipos de Tinta" },

    // Administration Module
    { name: "administration", title: "Administração" },
    { name: "administration/change-logs", title: "Registros de Alterações" },
    { name: "administration/change-logs/details/[id]", title: "Detalhes do Registro" },
    { name: "administration/change-logs/entity/[entityType]/[entityId]", title: "Registros por Entidade" },
    { name: "administration/change-logs/list", title: "Listar Registros de Alterações" },
    { name: "administration/commissions", title: "Comissões" },
    { name: "administration/commissions/details/[id]", title: "Detalhes da Comissão" },
    { name: "administration/commissions/edit/[id]", title: "Editar Comissão" },
    { name: "administration/commissions/list", title: "Listar Comissões" },
    { name: "administration/customers", title: "Clientes" },
    { name: "administration/customers/create", title: "Cadastrar Cliente" },
    { name: "administration/customers/details/[id]", title: "Detalhes do Cliente" },
    { name: "administration/customers/list", title: "Listar Clientes" },
    { name: "administration/employees", title: "Funcionários" },
    { name: "administration/employees/list", title: "Listar Funcionários" },
    { name: "administration/files", title: "Arquivos" },
    { name: "administration/files/details/[id]", title: "Detalhes do Arquivo" },
    { name: "administration/files/orphans", title: "Arquivos Órfãos" },
    { name: "administration/files/upload", title: "Fazer Upload de Arquivo" },
    { name: "administration/notifications", title: "Notificações" },
    { name: "administration/notifications/create", title: "Cadastrar Notificação" },
    { name: "administration/notifications/create/send", title: "Enviar Notificação" },
    { name: "administration/sectors", title: "Setores" },
    { name: "administration/sectors/create", title: "Cadastrar Setor" },
    { name: "administration/sectors/details/[id]", title: "Detalhes do Setor" },
    { name: "administration/sectors/edit/[id]", title: "Editar Setor" },

    // Human Resources Module
    { name: "human-resources", title: "Recursos Humanos" },
    { name: "human-resources/employees/create", title: "Cadastrar Funcionário" },
    { name: "human-resources/employees/details/[id]", title: "Detalhes do Funcionário" },
    { name: "human-resources/employees/edit/[id]", title: "Editar Funcionário" },
    { name: "human-resources/employees/list", title: "Listar Funcionários" },
    { name: "human-resources/ppe/create", title: "Cadastrar EPI" },
    { name: "human-resources/ppe/details/[id]", title: "Detalhes do EPI" },
    { name: "human-resources/ppe/edit/[id]", title: "Editar EPI" },
    { name: "human-resources/ppe/list", title: "Listar EPIs" },
    { name: "human-resources/ppe/deliveries/create", title: "Cadastrar Entrega de EPI" },
    { name: "human-resources/ppe/deliveries/details/[id]", title: "Detalhes da Entrega de EPI" },
    { name: "human-resources/ppe/deliveries/edit/[id]", title: "Editar Entrega de EPI" },
    { name: "human-resources/ppe/deliveries/list", title: "Listar Entregas de EPI" },
    { name: "human-resources/ppe/schedules/create", title: "Cadastrar Agendamento de EPI" },
    { name: "human-resources/ppe/schedules/details/[id]", title: "Detalhes do Agendamento de EPI" },
    { name: "human-resources/ppe/schedules/edit/[id]", title: "Editar Agendamento de EPI" },
    { name: "human-resources/ppe/schedules/list", title: "Listar Agendamentos de EPI" },
    { name: "human-resources/ppe/sizes/create", title: "Cadastrar Tamanho de EPI" },
    { name: "human-resources/ppe/sizes/details/[id]", title: "Detalhes do Tamanho de EPI" },
    { name: "human-resources/ppe/sizes/edit/[id]", title: "Editar Tamanho de EPI" },
    { name: "human-resources/ppe/sizes/list", title: "Listar Tamanhos de EPI" },
    { name: "human-resources/holidays", title: "Feriados" },
    { name: "human-resources/holidays/calendar", title: "Calendário de Feriados" },
    { name: "human-resources/positions", title: "Cargos" },
    { name: "human-resources/positions/[positionId]/remunerations", title: "Remunerações do Cargo" },
    { name: "human-resources/vacations/create", title: "Cadastrar Férias" },
    { name: "human-resources/vacations/details/[id]", title: "Detalhes das Férias" },
    { name: "human-resources/vacations/list", title: "Listar Férias" },
    { name: "human-resources/vacations/calendar", title: "Calendário de Férias" },
    { name: "human-resources/warnings/create", title: "Cadastrar Advertência" },
    { name: "human-resources/warnings/details/[id]", title: "Detalhes da Advertência" },
    { name: "human-resources/warnings/edit/[id]", title: "Editar Advertência" },
    { name: "human-resources/warnings/list", title: "Listar Advertências" },

    // Personal Module
    { name: "personal", title: "Pessoal" },
    { name: "personal/my-commissions", title: "Minhas Comissões" },
    { name: "personal/my-commissions/details/[id]", title: "Detalhes da Comissão" },
    { name: "personal/my-profile", title: "Meus Dados" },
    { name: "personal/my-holidays", title: "Meus Feriados" },
    { name: "personal/my-holidays/details/[id]", title: "Detalhes do Feriado" },
    { name: "personal/my-loans", title: "Meus Empréstimos" },
    { name: "personal/my-loans/details/[id]", title: "Detalhes do Empréstimo" },
    { name: "personal/my-notifications", title: "Minhas Notificações" },
    { name: "personal/my-notifications/details/[id]", title: "Detalhes da Notificação" },
    { name: "personal/my-notifications/settings", title: "Configurações de Notificação" },
    { name: "personal/my-ppes", title: "Meus PPEs" },
    { name: "personal/my-ppes/request", title: "Solicitar PPE" },
    { name: "personal/my-vacations", title: "Minhas Férias" },
    { name: "personal/my-vacations/details/[id]", title: "Detalhes das Férias" },
    { name: "personal/my-warnings", title: "Minhas Advertências" },
    { name: "personal/my-warnings/details/[id]", title: "Detalhes da Advertência" },
    { name: "personal/preferences", title: "Preferências" },
    { name: "personal/preferences/notifications", title: "Preferências de Notificação" },
    { name: "personal/preferences/privacy", title: "Privacidade" },
    { name: "personal/preferences/theme", title: "Tema" },

    // Statistics Module
    { name: "statistics", title: "Estatísticas" },
    { name: "statistics/administration", title: "Estatísticas - Administração" },
    { name: "statistics/human-resources", title: "Estatísticas - Recursos Humanos" },
    { name: "statistics/inventory", title: "Estatísticas - Estoque" },
    { name: "statistics/production", title: "Estatísticas - Produção" },
    { name: "statistics/statistics", title: "Estatísticas - Resumo" },
  ];

  return existingScreens;
};

// Function to determine if back button should be shown based on navigation history
const shouldShowBackButton = (pathname: string, canGoBack: boolean): boolean => {
  // Don't show back button for home screen
  if (pathname === "/home") return false;

  // Don't show back button for auth screens (they have their own navigation)
  if (pathname.startsWith("/(auth)")) return false;

  // Show back button if we can go back in navigation history
  return canGoBack;
};

function DrawerLayout() {
  const { isDark, theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { canGoBack, goBack, getBackPath } = useNavigationHistory();

  const screensToRegister = getScreensToRegister();

  const isDarkMode = theme === "dark" || (theme === "system" && isDark);

  // Get screen dimensions for responsive drawer width
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth < 360 ? screenWidth * 0.85 : Math.min(320, screenWidth * 0.8);

  // Use neutral colors to match web version
  const drawerColors = {
    background: isDarkMode ? "#262626" : "#f5f5f5", // neutral-800 : neutral-100
    headerBackground: isDarkMode ? "#262626" : "#f5f5f5", // neutral-800 : neutral-100
    text: isDarkMode ? "#f5f5f5" : "#404040", // neutral-100 : neutral-700
    active: "#16a34a", // green-600 for active items
    activeText: "#f5f5f5", // white text on green background
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
          borderBottomColor: isDarkMode ? "#404040" : "#d4d4d4", // neutral-700 : neutral-300
        },
        headerTintColor: drawerColors.text,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
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
              marginRight: 16,
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
