// Full Menu Drawer Content with Original Design/Style
// Preserves all the original hierarchical menu structure, animations, and styling
import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { selectionHaptic, impactHaptic, lightImpactHaptic } from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { IconChevronRight, IconStar, IconStarFilled } from '@tabler/icons-react-native';
import { MENU_ITEMS, MenuItem} from '@/constants';
import { getFilteredMenuForUser, getTablerIcon } from '@/utils/navigation';
import { routeToMobilePath, normalizePath } from '@/utils/route-mapper';
import { useFavorites } from '@/contexts/favorites-context';
import { useAuth } from '@/contexts/auth-context';
import { SECTOR_PRIVILEGES } from '@/constants/enums';
import { maskPhone } from '@/utils';

// Consistent spacing system (from original)
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

interface FullMenuDrawerContentProps extends DrawerContentComponentProps {
  accessibleRoutes?: any[];
  userPrivileges?: SECTOR_PRIVILEGES[];
  theme: string;
  isDark: boolean;
}

// Icon component from original
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

function FullMenuDrawerContent({
  navigation,
  accessibleRoutes,
  userPrivileges,
  theme,
  isDark,
  ...props
}: FullMenuDrawerContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const isDarkMode = isDark;

  // State for expandable menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navigatingItemId, setNavigatingItemId] = useState<string | null>(null);
  const [userMenuNavigating, setUserMenuNavigating] = useState<string | null>(null);
  const chevronAnimations = useRef<Record<string, Animated.Value>>({});

  // Filter menu items based on user privileges
  const filteredMenu = useMemo(() => {
    if (!user) return [];
    const filtered = getFilteredMenuForUser(MENU_ITEMS, user, 'mobile');
    // Sort alphabetically by title, except "Inicio" which should always be first
    return filtered.sort((a, b) => {
      if (a.id === 'home') return -1;
      if (b.id === 'home') return 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [user]);

  // Get favorite items
  const favoriteItems = useMemo(() => {
    const favorites_filtered = filteredMenu.filter(item => item.path && isFavorite(item.path));
    // Sort favorites alphabetically by title
    return favorites_filtered.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }, [filteredMenu, isFavorite]);

  // Chevron animation
  const getChevronAnimation = useCallback((itemId: string) => {
    if (!chevronAnimations.current[itemId]) {
      chevronAnimations.current[itemId] = new Animated.Value(0);
    }
    return chevronAnimations.current[itemId];
  }, []);

  // Toggle submenu with animation
  const toggleSubmenu = useCallback(
    (itemId: string) => {
      // Instant haptic feedback for submenu toggle
      selectionHaptic();

      setExpandedMenus((prev) => {
        const newExpanded = { ...prev };
        const isCurrentlyExpanded = prev[itemId];

        // Animate chevron
        const animation = getChevronAnimation(itemId);
        Animated.timing(animation, {
          toValue: isCurrentlyExpanded ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Close siblings if opening
        if (!isCurrentlyExpanded) {
          const findAndCloseSiblings = (items: MenuItem[], targetId: string) => {
            for (const item of items) {
              if (item.id !== targetId && item.children && item.children.length > 0) {
                if (newExpanded[item.id]) {
                  newExpanded[item.id] = false;
                  const siblingAnimation = getChevronAnimation(item.id);
                  Animated.timing(siblingAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
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
    if (item.path) return item.path;
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

      const tabRoute = routeToMobilePath(path);

      try {
        router.push(tabRoute as any);
        navigation?.closeDrawer?.();
      } catch (error) {
        console.warn("Navigation failed for route:", tabRoute, error);
        try {
          router.push('/(tabs)/inicio' as any);
          navigation?.closeDrawer?.();
        } catch (fallbackError) {
          console.error("Fallback navigation also failed:", fallbackError);
        }
      }
    },
    [router, navigation],
  );

  // Check if menu item is active
  const isItemActive = useCallback(
    (item: MenuItem): boolean => {
      if (!item.path) return false;

      const currentPath = pathname.replace(/^\/\(tabs\)/, "");
      const normalizedCurrent = normalizePath(currentPath);
      const normalizedItem = normalizePath(item.path);

      if (item.path === "/" || normalizedItem === "") {
        return normalizedCurrent === "home" || normalizedCurrent === "" || normalizedCurrent === "inicio";
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

  // Main item click handler
  const handleMainItemClick = useCallback(
    (item: MenuItem) => {
      // Instant haptic feedback - fires immediately on touch
      impactHaptic();

      // Instant visual feedback
      setNavigatingItemId(item.id);

      requestAnimationFrame(() => {
        const targetPath = getFirstSubmenuPath(item);
        if (targetPath) {
          navigateToPath(targetPath);
        }

        // Reset navigation state after navigation completes
        setTimeout(() => setNavigatingItemId(null), 1500);
      });
    },
    [navigateToPath],
  );

  // Check if item has active child
  const hasActiveChild = useCallback(
    (item: MenuItem): boolean => {
      if (!item.children) return false;

      return item.children.some((child) => {
        if (isItemActive(child)) return true;

        if (child.path) {
          const childPathWithTabs = `/(tabs)${child.path}`;
          if (pathname.startsWith(childPathWithTabs)) {
            return true;
          }
        }

        return hasActiveChild(child);
      });
    },
    [isItemActive, pathname],
  );

  // Check if item is in active path
  const isInActivePath = useCallback(
    (item: MenuItem): boolean => {
      if (isItemActive(item)) return false;
      return hasActiveChild(item);
    },
    [isItemActive, hasActiveChild],
  );

  // Timer ref for long press
  const longPressTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Render menu item with original styling
  const renderMenuItem = useCallback(
    (item: MenuItem, level = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedMenus[item.id];
      const isActive = isItemActive(item);
      const isInPath = isInActivePath(item);
      const isNavigating = navigatingItemId === item.id;
      const isItemFavorite = item.path ? isFavorite(item.path) : false;
      const chevronAnimation = hasChildren ? getChevronAnimation(item.id) : null;

      const chevronRotation = chevronAnimation?.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "90deg"],
      });

      const paddingLeft = SPACING.md;
      const marginLeft = level === 0 ? SPACING.sm : SPACING.sm + SPACING.lg * level;
      const marginRight = SPACING.sm;

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
                // Main row click behavior
                if (hasChildren) {
                  // For parent items, toggle submenu by default
                  toggleSubmenu(item.id);
                  // If they also have a path and want to navigate, they can long press
                } else {
                  // For leaf items, navigate
                  handleMainItemClick(item);
                }
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onLongPress={() => {
                // Long press navigates for parent items with paths
                if (hasChildren && item.path) {
                  handleMainItemClick(item);
                }
              }}
              delayLongPress={500}
              style={({ pressed }) => ({
                flex: 1,
                transform: pressed ? [{ scale: 0.96 }] : isNavigating ? [{ scale: 0.98 }] : [{ scale: 1 }],
                opacity: pressed ? 0.7 : isNavigating ? 0.85 : 1,
                backgroundColor: pressed
                  ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                  : isNavigating && !isActive
                    ? (isDarkMode ? "rgba(21, 128, 61, 0.1)" : "rgba(21, 128, 61, 0.08)")
                    : "transparent",
                borderRadius: 6,
              })}
              hitSlop={{ top: 2, bottom: 2, left: 0, right: 0 }}
            >
              <View style={[styles.menuItemContent, { paddingLeft }]}>
                <View style={styles.menuItemLeft}>
                  {/* Show loading indicator when navigating, otherwise show icon */}
                  {isNavigating ? (
                    <ActivityIndicator
                      size="small"
                      color={isActive ? "#fafafa" : "#15803d"}
                      style={{ width: 20, height: 20 }}
                    />
                  ) : (
                    getIconComponentLocal(item.icon, isActive ? "onPrimary" : "navigation")
                  )}
                  <Text
                    style={[
                      styles.menuItemText,
                      {
                        color: isActive ? "#fafafa" : isDarkMode ? "#e5e5e5" : "#262626",
                        fontWeight: isActive || isInPath ? "600" : "500",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  {/* Show loading indicator on the right when navigating */}
                  {isNavigating && !hasChildren && (
                    <Text style={{ fontSize: 11, color: "#15803d", marginRight: 4 }}>
                      Carregando...
                    </Text>
                  )}
                  {!hasChildren && !isNavigating && item.path && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        lightImpactHaptic();
                        toggleFavorite({
                          path: item.path!,
                          title: item.title,
                          icon: item.icon,
                        });
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.favoriteButton}
                    >
                      {isItemFavorite ? (
                        <IconStarFilled size={16} color="#facc15" />
                      ) : (
                        <IconStar size={16} color={isDarkMode ? "#525252" : "#a3a3a3"} />
                      )}
                    </Pressable>
                  )}
                  {hasChildren && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        // Clicking chevron always toggles the submenu
                        toggleSubmenu(item.id);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ padding: 4 }}
                    >
                      <Animated.View style={{ transform: [{ rotate: chevronRotation || "0deg" }] }}>
                        <IconChevronRight
                          size={16}
                          color={isActive ? "#ffffff" : isDarkMode ? "#737373" : "#a3a3a3"}
                        />
                      </Animated.View>
                    </Pressable>
                  )}
                </View>
              </View>
            </Pressable>
          </View>

          {hasChildren && isExpanded && (
            <View style={styles.submenu}>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </View>
          )}
        </View>
      );
    },
    [expandedMenus, isItemActive, isInActivePath, navigatingItemId, isFavorite, toggleFavorite, getChevronAnimation, isDarkMode, handleMainItemClick, navigateToPath, toggleSubmenu],
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff" }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top padding */}
        <View style={{ height: insets.top }} />

        {/* User profile section */}
        <View style={styles.userSection}>
          <Pressable
            onPress={() => {
              selectionHaptic();
              setShowUserMenu(!showUserMenu);
            }}
            style={({ pressed }) => [
              styles.userProfile,
              pressed && {
                opacity: 0.7,
                transform: [{ scale: 0.98 }],
                backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                borderRadius: 8,
              },
            ]}
          >
            <View style={styles.userAvatar}>
              <Icon name="user-circle" size="lg" variant="muted" />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: isDarkMode ? "#f5f5f5" : "#171717" }]} numberOfLines={1}>
                {user?.nome || "Usuário"}
              </Text>
              <Text style={[styles.userRole, { color: isDarkMode ? "#a3a3a3" : "#737373" }]} numberOfLines={1}>
                {user?.sector?.name || "Colaborador"}
              </Text>
              {user?.phone && (
                <Text style={[styles.userPhone, { color: isDarkMode ? "#737373" : "#a3a3a3" }]} numberOfLines={1}>
                  {maskPhone(user.phone)}
                </Text>
              )}
            </View>
          </Pressable>

          {/* User menu dropdown */}
          {showUserMenu && (
            <View style={[styles.userMenu, { backgroundColor: isDarkMode ? "#171717" : "#f5f5f5" }]}>
              <Pressable
                onPress={() => {
                  impactHaptic();
                  setUserMenuNavigating('profile');
                  router.push('/(tabs)/pessoal/meu-perfil' as any);
                  setShowUserMenu(false);
                  navigation?.closeDrawer?.();
                  setTimeout(() => setUserMenuNavigating(null), 1500);
                }}
                disabled={userMenuNavigating === 'profile'}
                style={({ pressed }) => [
                  styles.userMenuItem,
                  pressed && {
                    backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)",
                    transform: [{ scale: 0.97 }],
                  },
                  userMenuNavigating === 'profile' && {
                    backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.1)" : "rgba(21, 128, 61, 0.08)",
                  },
                ]}
              >
                {userMenuNavigating === 'profile' ? (
                  <ActivityIndicator size="small" color="#15803d" style={{ width: 16, height: 16 }} />
                ) : (
                  <Icon name="user" size="sm" variant="muted" />
                )}
                <Text style={[styles.userMenuText, { color: isDarkMode ? "#e5e5e5" : "#262626" }]}>
                  {userMenuNavigating === 'profile' ? 'Carregando...' : 'Meu Perfil'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  impactHaptic();
                  setUserMenuNavigating('settings');
                  router.push('/(tabs)/configuracoes' as any);
                  setShowUserMenu(false);
                  navigation?.closeDrawer?.();
                  setTimeout(() => setUserMenuNavigating(null), 1500);
                }}
                disabled={userMenuNavigating === 'settings'}
                style={({ pressed }) => [
                  styles.userMenuItem,
                  pressed && {
                    backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)",
                    transform: [{ scale: 0.97 }],
                  },
                  userMenuNavigating === 'settings' && {
                    backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.1)" : "rgba(21, 128, 61, 0.08)",
                  },
                ]}
              >
                {userMenuNavigating === 'settings' ? (
                  <ActivityIndicator size="small" color="#15803d" style={{ width: 16, height: 16 }} />
                ) : (
                  <Icon name="settings" size="sm" variant="muted" />
                )}
                <Text style={[styles.userMenuText, { color: isDarkMode ? "#e5e5e5" : "#262626" }]}>
                  {userMenuNavigating === 'settings' ? 'Carregando...' : 'Configurações'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Favorites section */}
        {favoriteItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? "#737373" : "#a3a3a3" }]}>
              FAVORITOS
            </Text>
            {favoriteItems.map((item) => renderMenuItem(item, 0))}
          </View>
        )}

        {/* Main menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? "#737373" : "#a3a3a3" }]}>
            MENU
          </Text>
          {filteredMenu.map((item) => renderMenuItem(item, 0))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
  },
  userPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  userMenu: {
    marginTop: SPACING.sm,
    borderRadius: 8,
    overflow: "hidden",
  },
  userMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  userMenuText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginLeft: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  menuItem: {
    marginBottom: 2,
  },
  menuItemPressable: {
    borderRadius: 6,
    overflow: "hidden",
    minHeight: 40,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    minHeight: 40,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
    paddingVertical: 2, // Add some padding for better touch target
  },
  menuItemText: {
    fontSize: 14,
    flex: 1,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  favoriteButton: {
    padding: 4,
  },
  submenu: {
    marginTop: 2,
  },
});

export default memo(FullMenuDrawerContent);