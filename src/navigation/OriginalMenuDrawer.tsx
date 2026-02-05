import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text as RNText,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
} from "react-native";
const Text = RNText; // Use React Native's Text directly
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import {
  IconChevronRight,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconSettings,
  IconStar,
  IconStarFilled,
  IconRefresh,
} from "@tabler/icons-react-native";
import { selectionHaptic, impactHaptic, lightImpactHaptic } from "@/utils/haptics";
import { useRouter, usePathname, useNavigation } from "expo-router";
import { MENU_ITEMS, routes, MenuItem} from '@/constants';
import { getFilteredMenuForUser, getTablerIcon } from '@/utils/navigation';
import { routeToMobilePath, normalizePath } from '@/utils/route-mapper';
import { maskPhone } from '@/utils';
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useDrawerStatus } from "@react-navigation/drawer";

// Spacing constants
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Icon rendering helper
const getIconComponentLocal = (
  iconKey: string,
  variant: "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "info" | "navigation" | "navigationActive" | "onPrimary" = "navigation"
) => {
  try {
    const tablerIconName = iconKey.startsWith("Icon") ? iconKey : getTablerIcon(iconKey);
    return <Icon name={tablerIconName} size="tab" variant={variant} />;
  } catch (error) {
    return <Icon name="menu" size="tab" variant={variant} />;
  }
};

export default function OriginalMenuDrawer(props: DrawerContentComponentProps) {
  const { user: authUser, logout, refreshUserData } = useAuth();
  const { theme, setTheme, isDark: isDarkMode } = useTheme();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { clearHistory } = useNavigationHistory();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { navigation } = props;
  const drawerStatus = useDrawerStatus();

  // State
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);
  const [navigatingItemId, setNavigatingItemId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingTheme, setIsTogglingTheme] = useState(false);

  // Animation refs
  const chevronAnimations = useRef(new Map<string, Animated.Value>());
  // Timer refs for long press - moved to component level to fix hooks order
  const longPressTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Dropdown animation
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  // Get or create chevron animation
  const getChevronAnimation = useCallback((itemId: string): Animated.Value => {
    if (!chevronAnimations.current.has(itemId)) {
      const isExpanded = expandedMenus[itemId];
      chevronAnimations.current.set(itemId, new Animated.Value(isExpanded ? 1 : 0));
    }
    return chevronAnimations.current.get(itemId)!;
  }, [expandedMenus]);

  // Helper function to reset all chevron animations
  const resetAllChevronAnimations = useCallback(() => {
    chevronAnimations.current.forEach((animation) => {
      animation.setValue(0);
    });
  }, []);

  // Helper function to close user dropdown menu with animation
  const closeUserMenu = useCallback(() => {
    if (showUserMenu) {
      setShowUserMenu(false);
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showUserMenu, dropdownAnimation]);

  // Close user menu when drawer is closed/minimized
  useEffect(() => {
    if (drawerStatus === 'closed') {
      setShowUserMenu(false);
      dropdownAnimation.setValue(0);
    }
  }, [drawerStatus, dropdownAnimation]);

  // Create user object for navigation
  const navUser = useMemo(() => {
    if (!authUser) return null;

    // Use the sector property directly from the user
    const userSector = authUser.sector || authUser.position?.sector;

    return {
      ...authUser,
      sector: userSector,
      position: authUser.position,
    };
  }, [authUser]);

  // Filter menu based on user privileges and hide detail/edit pages
  const filteredMenu = useMemo(() => {
    if (!navUser) return [];

    const filterDetailPages = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => {
          // Hide detail/edit/create/list pages from menu
          if (item.path) {
            const path = item.path.toLowerCase();

            // More aggressive filtering for CRUD operations
            const crudPatterns = [
              'detalhes',
              'cadastrar',
              'editar',
              'lote',
              'listar',
              'criar',
              'novo',
              'adicionar',
              'remover',
              'deletar',
              'excluir'
            ];

            const isCrudPage = crudPatterns.some(pattern => path.includes(pattern));

            if (isCrudPage) {
              // Only show if we're currently on this exact page
              const currentPath = pathname.replace(/^\/\(tabs\)/, "");
              return item.path === currentPath;
            }
          }
          return true;
        })
        .map((item) => {
          if (item.children) {
            return {
              ...item,
              children: filterDetailPages(item.children),
            };
          }
          return item;
        })
        .filter((item) => {
          // Remove parent items that have no children after filtering
          if (item.children && item.children.length === 0 && !item.path) {
            return false;
          }
          return true;
        });
    };

    const userFilteredMenu = getFilteredMenuForUser(MENU_ITEMS, navUser, 'mobile');
    return filterDetailPages(userFilteredMenu);
  }, [navUser, pathname]);

  // Toggle submenu expansion (accordion style - only collapse same-level siblings)
  const toggleSubmenu = useCallback(
    (itemId: string, parentId: string | null = null, event?: any) => {
      if (event) {
        event.stopPropagation();
      }

      // INSTANT haptic feedback for submenu toggle
      selectionHaptic();

      setExpandedMenus((prev) => {
        const isCurrentlyExpanded = prev[itemId];
        const newExpanded = { ...prev };

        // Find all siblings (items with same parent)
        const getSiblings = (targetId: string, targetParentId: string | null) => {
          const siblings: string[] = [];

          // Helper function to traverse menu and find siblings
          const findSiblings = (items: MenuItem[], currentParentId: string | null = null) => {
            items.forEach(item => {
              // If this item has the same parent as our target, it's a sibling
              if (currentParentId === targetParentId && item.id !== targetId) {
                siblings.push(item.id);
              }
              // Recursively check children
              if (item.children) {
                findSiblings(item.children, item.id);
              }
            });
          };

          findSiblings(filteredMenu);
          return siblings;
        };

        // Close only sibling menus at the same level
        const siblings = getSiblings(itemId, parentId);
        siblings.forEach(siblingId => {
          if (newExpanded[siblingId]) {
            delete newExpanded[siblingId];
            const animation = getChevronAnimation(siblingId);
            Animated.timing(animation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        });

        // Animate the clicked item's chevron
        const animation = getChevronAnimation(itemId);
        Animated.timing(animation, {
          toValue: isCurrentlyExpanded ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Toggle the clicked item
        if (isCurrentlyExpanded) {
          delete newExpanded[itemId];
        } else {
          newExpanded[itemId] = true;
        }

        return newExpanded;
      });
    },
    [getChevronAnimation, filteredMenu],
  );

  // Toggle favorites section
  const toggleShowFavorites = useCallback(() => {
    // INSTANT haptic feedback
    selectionHaptic();
    setShowFavorites((prev) => !prev);
  }, []);

  // Navigate to path
  const navigateToPath = useCallback(
    (path: string) => {
      if (!path || typeof path !== "string" || path.trim() === "") {
        console.warn("No path provided for navigation");
        return;
      }

      const tabRoute = routeToMobilePath(path);

      console.log('📱 [MENU NAV] ========== START ==========');
      console.log('📱 [MENU NAV] Current pathname:', pathname);
      console.log('📱 [MENU NAV] Target route:', tabRoute);

      try {
        // Always use push for consistent behavior
        // The navigation history context will track the proper history
        console.log('📱 [MENU NAV] Navigating with push');
        router.push(tabRoute as any);

        props.navigation?.closeDrawer?.();
        closeUserMenu();
        console.log('📱 [MENU NAV] Navigation successful');
      } catch (error) {
        console.error('📱 [MENU NAV] Navigation failed:', error);
      }

      console.log('📱 [MENU NAV] ========== END ==========');
    },
    [router, props.navigation, closeUserMenu, pathname],
  );

  // Get first submenu path for navigation
  const getFirstSubmenuPath = (item: MenuItem): string | null => {
    if (item.path) return item.path;

    if (item.children?.length) {
      const firstChild = item.children.find((child) => child.path);
      return firstChild?.path || null;
    }

    return null;
  };

  // Check if item is active
  const isItemActive = useCallback(
    (item: MenuItem): boolean => {
      if (!item.path) return false;

      const currentPath = pathname.replace(/^\/\(tabs\)/, "");
      const normalizedCurrent = normalizePath(currentPath);
      const normalizedItem = normalizePath(item.path);

      if (item.path === "/" || normalizedItem === "") {
        return normalizedCurrent === "home" || normalizedCurrent === "";
      }

      if (normalizedCurrent === normalizedItem) {
        return true;
      }

      if (item.children && item.children.length > 0) {
        const hasMatchingChild = item.children.some((child) => {
          if (!child.path) return false;
          const childNormalized = normalizePath(child.path);
          return normalizedCurrent === childNormalized ||
                 normalizedCurrent.startsWith(childNormalized + "/");
        });

        if (hasMatchingChild) {
          return true;
        }
      }

      if (normalizedCurrent.startsWith(normalizedItem + "/")) {
        return true;
      }

      return false;
    },
    [pathname],
  );

  // Check if item has active child
  const hasActiveChild = useCallback(
    (item: MenuItem): boolean => {
      if (!item.children) return false;

      return item.children.some((child) => {
        if (isItemActive(child)) return true;
        return hasActiveChild(child);
      });
    },
    [isItemActive],
  );

  // Check if item is in active path
  const isInActivePath = useCallback(
    (item: MenuItem): boolean => {
      if (isItemActive(item)) return false;
      return hasActiveChild(item);
    },
    [isItemActive, hasActiveChild],
  );

  // Handle main item click
  const handleMainItemClick = useCallback(
    (item: MenuItem) => {
      // INSTANT haptic feedback - fires immediately on touch
      impactHaptic();

      // INSTANT visual feedback
      setNavigatingItemId(item.id);

      requestAnimationFrame(() => {
        const targetPath = getFirstSubmenuPath(item);
        if (targetPath) {
          navigateToPath(targetPath);
        }

        // Keep loading state until navigation completes
        setTimeout(() => setNavigatingItemId(null), 1500);
      });
    },
    [navigateToPath],
  );


  // Render menu item
  const renderMenuItem = useCallback(
    (item: MenuItem, level = 0, parentId: string | null = null) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedMenus[item.id];
      const isActive = isItemActive(item);
      const isInPath = isInActivePath(item);
      const isNavigating = navigatingItemId === item.id;
      const chevronAnimation = hasChildren ? getChevronAnimation(item.id) : null;

      const chevronRotation = chevronAnimation?.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "90deg"],
      });

      const paddingLeft = SPACING.md;
      const marginLeft = level === 0 ? SPACING.sm : SPACING.sm + SPACING.lg * level;
      const marginRight = SPACING.sm;

      // Long press handlers using component-level timer ref
      const handleLongPress = () => {
        if (hasChildren) {
          const targetPath = getFirstSubmenuPath(item);
          if (targetPath) {
            navigateToPath(targetPath);
          }
        }
      };

      const handlePressIn = () => {
        if (hasChildren && !item.path) {
          const timer = setTimeout(() => {
            handleLongPress();
          }, 500);
          longPressTimers.current.set(item.id, timer);
        }
      };

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
                backgroundColor: "#15803d", // green-700
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
                if (hasChildren && item.path) {
                  handleMainItemClick(item);
                } else if (!hasChildren) {
                  handleMainItemClick(item);
                } else {
                  toggleSubmenu(item.id, parentId);
                }
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onLongPress={handleLongPress}
              delayLongPress={500}
              style={({ pressed }) => ({
                flex: 1,
                // More pronounced scale feedback
                transform: pressed ? [{ scale: 0.96 }] : isNavigating ? [{ scale: 0.98 }] : [{ scale: 1 }],
                opacity: pressed ? 0.7 : isNavigating ? 0.85 : 1,
                // Green-tinted background for better visual feedback
                backgroundColor: pressed
                  ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                  : isNavigating && !isActive
                    ? (isDarkMode ? "rgba(21, 128, 61, 0.1)" : "rgba(21, 128, 61, 0.08)")
                    : "transparent",
                borderRadius: 8,
              })}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityState={{ expanded: isExpanded, selected: isActive }}
            >
              <View style={styles.menuItemInner}>
                <View style={[styles.menuItemContent, { paddingLeft }]}>
                  <View style={styles.menuItemIcon}>
                    {/* Show loading indicator when navigating */}
                    {isNavigating ? (
                      <ActivityIndicator
                        size="small"
                        color={isActive ? "#fafafa" : "#15803d"}
                        style={{ width: 20, height: 20 }}
                      />
                    ) : (
                      getIconComponentLocal(item.icon, isActive ? "onPrimary" : isInPath ? "primary" : "navigation")
                    )}
                  </View>
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                      !isActive && isInPath && styles.menuItemTextInPath,
                      { fontSize: level === 0 ? 14 : 13 },
                      {
                        color: isActive ? "#fafafa" : isDarkMode ? "#cccccc" : "#525252",
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {isNavigating ? "Carregando..." : (item.title || item.id || 'Untitled')}
                  </Text>

                  {item.isContextual && !isNavigating && (
                    <View style={styles.contextualBadge}>
                      <Text style={styles.contextualBadgeText}>ATUAL</Text>
                    </View>
                  )}
                </View>

                {/* Favorite toggle button - only for items with paths */}
                {item.path && !item.isContextual && !isNavigating && (() => {
                  const itemPath = item.path; // Capture path to ensure TypeScript narrowing
                  return (
                    <Pressable
                      onPress={async (e) => {
                        e.stopPropagation();
                        // Instant haptic feedback for favorite toggle
                        lightImpactHaptic();
                        await toggleFavorite({
                          path: itemPath,
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
                      {isFavorite(itemPath) ? (
                        <IconStarFilled size={16} color="#eab308" />
                      ) : (
                        <IconStar size={16} color={isActive ? "#fafafa" : (isDarkMode ? "#cccccc" : "#525252")} opacity={0.5} />
                      )}
                    </Pressable>
                  );
                })()}

                {/* Chevron for expandable items */}
                {hasChildren && (
                  <Pressable
                    onPress={(e) => {
                      toggleSubmenu(item.id, parentId, e);
                    }}
                    style={styles.chevronContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.chevronTouchable}>
                      {chevronAnimation ? (
                        <Animated.View style={{ transform: [{ rotate: chevronRotation || '0deg' }] }}>
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

          {/* Submenu */}
          {hasChildren && isExpanded && (
            <View style={styles.submenu}>
              {item.children!.map((child) => renderMenuItem(child, level + 1, item.id))}
            </View>
          )}
        </View>
      );
    },
    [expandedMenus, navigatingItemId, isDarkMode, isItemActive, isInActivePath, getChevronAnimation, toggleSubmenu, handleMainItemClick, navigateToPath, isFavorite, toggleFavorite, longPressTimers],
  );

  return (
    <TouchableWithoutFeedback onPress={closeUserMenu}>
      <View style={[styles.container, { flex: 1, backgroundColor: isDarkMode ? "#212121" : "#fafafa" }]}>
        {/* Header Section - User Profile & Theme Toggle */}
        <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? Math.max(insets.top, 20) : Math.max(insets.top, 16) }]}>
          <View style={styles.headerContent}>
            <View style={{ width: "100%" }}>
              <Pressable
                onPress={() => {
                  // INSTANT haptic feedback
                  selectionHaptic();
                  const newValue = !showUserMenu;
                  setShowUserMenu(newValue);
                  Animated.timing(dropdownAnimation, {
                    toValue: newValue ? 1 : 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                }}
                style={({ pressed }) => [
                  {
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    width: "100%",
                    backgroundColor: pressed ? (isDarkMode ? "rgba(21, 128, 61, 0.15)" : "rgba(21, 128, 61, 0.1)") : "transparent",
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel="Menu do usuário"
              >
                <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      marginRight: 8,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isDarkMode ? "#ffffff" : "#171717",
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {authUser?.name || "Usuário"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? "#d4d4d4" : "#525252",
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {(() => {
                        if (authUser?.email) return authUser.email;
                        if (authUser?.phone) return maskPhone(authUser.phone);
                        return "Email/Phone";
                      })()}
                    </Text>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: dropdownAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "180deg"],
                        })
                      }]
                    }}
                  >
                    <IconChevronDown size={16} color={isDarkMode ? "#8c8c8c" : "#737373"} />
                  </Animated.View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <Animated.View style={[
              styles.userDropdown,
              {
                backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                borderColor: isDarkMode ? "#404040" : "#e0e0e0",
                opacity: dropdownAnimation,
                transform: [
                  {
                    translateY: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                  {
                    scale: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }
            ]}>
              <Pressable
                onPress={() => {
                  // INSTANT haptic feedback
                  impactHaptic();
                  closeUserMenu();
                  navigateToPath(routes.profile.root);
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                      : "transparent",
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }}>
                  <IconUser size={22} color={isDarkMode ? "#d4d4d4" : "#404040"} />
                  <Text style={{ fontSize: 15, fontWeight: "500", marginLeft: 12, color: isDarkMode ? "#d4d4d4" : "#404040" }}>
                    Meu Perfil
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  // INSTANT haptic feedback
                  impactHaptic();
                  closeUserMenu();
                  navigateToPath(routes.personal.preferences.root);
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                      : "transparent",
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }}>
                  <IconSettings size={22} color={isDarkMode ? "#d4d4d4" : "#404040"} />
                  <Text style={{ fontSize: 15, fontWeight: "500", marginLeft: 12, color: isDarkMode ? "#d4d4d4" : "#404040" }}>
                    Configurações
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (isTogglingTheme) return;

                  // INSTANT haptic feedback for theme toggle
                  impactHaptic();

                  // INSTANT visual feedback - show loading BEFORE async operation
                  setIsTogglingTheme(true);

                  // Use requestAnimationFrame to ensure UI updates first
                  requestAnimationFrame(() => {
                    // Fire and forget - don't await
                    setTheme(isDarkMode ? 'light' : 'dark');
                    // Reset after theme completes
                    setTimeout(() => setIsTogglingTheme(false), 500);
                  });
                }}
                disabled={isTogglingTheme}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed || isTogglingTheme
                      ? (isDarkMode ? "rgba(21, 128, 61, 0.25)" : "rgba(21, 128, 61, 0.2)")
                      : "transparent",
                    transform: pressed ? [{ scale: 0.95 }] : isTogglingTheme ? [{ scale: 0.97 }] : [{ scale: 1 }],
                    opacity: pressed ? 0.8 : isTogglingTheme ? 0.85 : 1,
                  }
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }}>
                  {isTogglingTheme ? (
                    <ActivityIndicator size="small" color="#15803d" style={{ width: 22, height: 22 }} />
                  ) : (
                    <Icon name={isDarkMode ? "moon" : "sun"} size={22} variant={isDarkMode ? "muted" : "default"} />
                  )}
                  <Text style={{ fontSize: 15, fontWeight: "500", marginLeft: 12, color: isTogglingTheme ? "#15803d" : (isDarkMode ? "#d4d4d4" : "#404040") }}>
                    {isTogglingTheme ? "Alterando..." : (isDarkMode ? "Tema Escuro" : "Tema Claro")}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  closeUserMenu();
                  logout();
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? (isDarkMode ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)")
                      : "transparent",
                    marginTop: 4,
                  }
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }}>
                  <IconLogout size={22} color={isDarkMode ? "#ef4444" : "#dc2626"} />
                  <Text style={{ fontSize: 15, fontWeight: "600", marginLeft: 12, color: isDarkMode ? "#ef4444" : "#dc2626" }}>
                    Sair
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* Main navigation area */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <View style={{ marginBottom: SPACING.xs }}>
              {/* Favorites Header */}
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

              {/* Favorites List */}
              {showFavorites && (
                <View style={styles.submenu}>
                  {favorites.map((favorite) => {
                    const currentPath = pathname.replace(/^\/\(tabs\)/, "");
                    const isFavoriteActive = normalizePath(currentPath) === normalizePath(favorite.path);

                    return (
                      <View key={favorite.id} style={styles.menuItem}>
                        <View
                          style={[
                            styles.menuItemPressable,
                            {
                              marginLeft: SPACING.sm + SPACING.lg,
                              marginRight: SPACING.sm
                            },
                            isFavoriteActive && {
                              backgroundColor: "#15803d",
                            },
                          ]}
                        >
                          <Pressable
                            onPress={() => {
                              // INSTANT haptic feedback
                              impactHaptic();
                              navigateToPath(favorite.path);
                            }}
                            style={({ pressed }) => ({
                              flex: 1,
                              opacity: pressed ? 0.7 : 1,
                              transform: pressed ? [{ scale: 0.96 }] : [{ scale: 1 }],
                              backgroundColor: pressed && !isFavoriteActive
                                ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                                : "transparent",
                              borderRadius: 8,
                            })}
                          >
                            <View style={styles.menuItemInner}>
                              <View style={[styles.menuItemContent, { paddingLeft: SPACING.md }]}>
                                <View style={styles.menuItemIcon}>
                                  {getIconComponentLocal(favorite.icon || "star", isFavoriteActive ? "onPrimary" : "navigation")}
                                </View>
                                <Text
                                  style={[
                                    styles.menuItemText,
                                    {
                                      fontSize: 13,
                                      color: isFavoriteActive ? "#fafafa" : isDarkMode ? "#cccccc" : "#525252",
                                      fontWeight: isFavoriteActive ? "600" : "400",
                                    },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
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
            </View>
          )}

          {/* Main Menu Items */}
          {filteredMenu.map((item) => renderMenuItem(item, 0))}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    minHeight: 64,
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
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 0,
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    backgroundColor: "#15803d",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatarText: {
    color: "#fafafa",
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
    lineHeight: 18,
  },
  userDetail: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  userDropdown: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
    width: "100%",
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
    marginLeft: 12,
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
    minHeight: 44,
    overflow: "hidden",
  },
  menuItemInner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minHeight: 44,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: SPACING.md,
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
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  menuItemTextActive: {
    fontWeight: "600",
    color: "#fafafa",
  },
  menuItemTextInPath: {
    fontWeight: "600",
    color: "#15803d",
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
    backgroundColor: "rgba(21, 128, 61, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  contextualBadgeText: {
    fontSize: 10,
    color: "#15803d",
    fontWeight: "600",
  },
  submenu: {
    marginTop: SPACING.xs,
  },
});