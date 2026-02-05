// Optimized Drawer Content Component
import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { MENU_ITEMS, MenuItem } from '@/constants';
import { getFilteredMenuForUser, getTablerIcon } from '@/utils/navigation';
import { useFavorites } from '@/contexts/favorites-context';
import { useAuth } from '@/contexts/auth-context';
import { IconChevronRight} from '@tabler/icons-react-native';

interface DrawerContentProps extends DrawerContentComponentProps {
  onNavigate?: (path: string) => Promise<void>;
  onPrefetch?: (moduleName: string) => void;
  userPrivileges?: string[];
  theme?: string;
  isDark: boolean;
}

interface MenuSectionProps {
  item: MenuItem;
  level: number;
  isActive: boolean;
  isInPath: boolean;
  isExpanded: boolean;
  isDarkMode: boolean;
  onPress: () => void;
  onToggle: () => void;
  onPrefetch?: () => void;
}

// Helper to get icon component
const getIconComponent = (iconKey: string, variant: any = 'navigation') => {
  try {
    const tablerIconName = iconKey.startsWith('Icon') ? iconKey : getTablerIcon(iconKey);
    return <Icon name={tablerIconName} size="tab" variant={variant} />;
  } catch {
    return <Icon name="menu" size="tab" variant={variant} />;
  }
};

// Memoized menu item component for performance
const MenuSection = memo<MenuSectionProps>(({
  item,
  level,
  isActive,
  isInPath,
  isExpanded,
  isDarkMode,
  onPress,
  onToggle,
  onPrefetch,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = 16 + level * 16;

  const itemStyle = useMemo(() => [
    styles.menuItem,
    { paddingLeft },
    isActive && styles.menuItemActive,
    isInPath && styles.menuItemInPath,
  ], [paddingLeft, isActive, isInPath]);

  const textStyle = useMemo(() => [
    styles.menuItemText,
    isActive && styles.menuItemTextActive,
    isInPath && styles.menuItemTextInPath,
    { color: isDarkMode ? '#e5e5e5' : '#262626' },
  ], [isActive, isInPath, isDarkMode]);

  return (
    <Pressable
      onPress={hasChildren ? onToggle : onPress}
      onHoverIn={Platform.select({ web: onPrefetch })}
      style={({ pressed }) => [
        ...itemStyle,
        pressed && styles.menuItemPressed,
      ]}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          {getIconComponent(item.icon, isActive ? 'onPrimary' : 'navigation')}
          <Text style={textStyle}>{item.title}</Text>
        </View>
        {hasChildren && (
          <IconChevronRight
            size={16}
            color={isActive ? '#ffffff' : isDarkMode ? '#737373' : '#a3a3a3'}
            style={[
              styles.chevron,
              isExpanded && styles.chevronExpanded,
            ]}
          />
        )}
      </View>
    </Pressable>
  );
});

MenuSection.displayName = 'MenuSection';

// Main drawer content component
function DrawerContentComponent({
  navigation,
  onNavigate,
  onPrefetch,
  isDark,
}: DrawerContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter menu items based on user privileges
  const filteredMenu = useMemo(() => {
    if (!user) return [];
    return getFilteredMenuForUser(MENU_ITEMS, user, 'mobile');
  }, [user]);

  // Get favorite items - filter by path since favorites contain FavoriteItem objects
  const favoriteItems = useMemo(() =>
    filteredMenu.filter(item => item.path && favorites.some(fav => fav.path === item.path)),
    [filteredMenu, favorites]
  );

  // Check if path matches
  const isPathActive = useCallback((itemPath?: string) => {
    if (!itemPath) return false;
    const normalizedPath = itemPath.replace(/^\//, '');
    const normalizedPathname = pathname.replace(/^\/(tabs\/)?/, '');
    return normalizedPath === normalizedPathname;
  }, [pathname]);

  const isPathInRoute = useCallback((itemPath?: string) => {
    if (!itemPath) return false;
    const normalizedPath = itemPath.replace(/^\//, '');
    const normalizedPathname = pathname.replace(/^\/(tabs\/)?/, '');
    return normalizedPathname.startsWith(normalizedPath);
  }, [pathname]);

  // Toggle expanded state
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Handle navigation
  const handleNavigate = useCallback(async (item: MenuItem) => {
    if (!item.path) return;

    const startTime = Date.now();

    // Close drawer first for better UX
    navigation.closeDrawer();

    // Trigger module loading if needed
    if (onNavigate) {
      await onNavigate(item.path);
    }

    // Navigate to the route
    const routePath = item.path.replace(/^\//, '');
    router.push(`/(tabs)/${routePath}` as any);

    console.log(`[Navigation] ${item.path} - ${Date.now() - startTime}ms`);
  }, [navigation, router, onNavigate]);

  // Prefetch module on hover/focus
  const handlePrefetch = useCallback((path: string) => {
    if (!onPrefetch) return;

    if (path.startsWith('/producao')) {
      onPrefetch('production');
    } else if (path.startsWith('/estoque')) {
      onPrefetch('inventory');
    } else if (path.startsWith('/recursos-humanos')) {
      onPrefetch('hr');
    } else if (path.startsWith('/administracao')) {
      onPrefetch('admin');
    }
  }, [onPrefetch]);

  // Render menu items recursively
  const renderMenuItem = useCallback((item: MenuItem, level = 0) => {
    const isActive = isPathActive(item.path);
    const isInPath = isPathInRoute(item.path);
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <View key={item.id}>
        <MenuSection
          item={item}
          level={level}
          isActive={isActive}
          isInPath={isInPath}
          isExpanded={isExpanded}
          isDarkMode={isDark}
          onPress={() => handleNavigate(item)}
          onToggle={() => toggleExpanded(item.id)}
          onPrefetch={() => item.path && handlePrefetch(item.path)}
        />

        {hasChildren && isExpanded && (
          <View style={styles.submenu}>
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  }, [
    expandedItems,
    isPathActive,
    isPathInRoute,
    handleNavigate,
    toggleExpanded,
    handlePrefetch,
    isDark,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User info section */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Icon name="user-circle" size="lg" variant="muted" />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: isDark ? '#f5f5f5' : '#171717' }]}>
                {user?.nome || 'Usuário'}
              </Text>
              <Text style={[styles.userRole, { color: isDark ? '#a3a3a3' : '#737373' }]}>
                {user?.sector?.name || 'Cargo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Favorites section */}
        {favoriteItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#a3a3a3' : '#737373' }]}>
              FAVORITOS
            </Text>
            {favoriteItems.map(item => renderMenuItem(item))}
          </View>
        )}

        {/* Main menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#a3a3a3' : '#737373' }]}>
            MENU
          </Text>
          {filteredMenu.map(item => renderMenuItem(item))}
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
  scrollContent: {
    paddingVertical: 8,
  },
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 10,
    paddingRight: 16,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(21, 128, 61, 0.1)',
  },
  menuItemActive: {
    backgroundColor: '#15803d',
  },
  menuItemInPath: {
    backgroundColor: 'rgba(21, 128, 61, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#15803d',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  menuItemTextInPath: {
    color: '#15803d',
    fontWeight: '600',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  submenu: {
    marginTop: 2,
  },
});

export default memo(DrawerContentComponent);