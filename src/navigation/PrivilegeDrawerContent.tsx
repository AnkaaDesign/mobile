// Privilege-Optimized Drawer Content
// Only shows routes the user has access to - dramatically faster for limited users
import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { MENU_ITEMS, MenuItem } from '@/constants';
import { getTablerIcon } from '@/utils/navigation';
import { useFavorites } from '@/contexts/favorites-context';
import { useAuth } from '@/contexts/auth-context';
import { SECTOR_PRIVILEGES } from '@/constants/enums';

interface PrivilegeDrawerContentProps extends DrawerContentComponentProps {
  accessibleRoutes: any[];
  userPrivileges: SECTOR_PRIVILEGES[];
  theme: string;
  isDark: boolean;
}

// Privilege badge component
const PrivilegeBadge = memo<{ privilege: SECTOR_PRIVILEGES; isDark: boolean }>(
  ({ privilege, isDark }) => {
    const getPrivilegeColor = () => {
      switch (privilege) {
        case SECTOR_PRIVILEGES.ADMIN: return '#dc2626'; // red
        case SECTOR_PRIVILEGES.PRODUCTION: return '#2563eb'; // blue
        case SECTOR_PRIVILEGES.HUMAN_RESOURCES: return '#9333ea'; // purple
        case SECTOR_PRIVILEGES.FINANCIAL: return '#9333ea'; // purple (same as HR)
        case SECTOR_PRIVILEGES.DESIGNER: return '#9333ea'; // purple (same as HR)
        case SECTOR_PRIVILEGES.LOGISTIC: return '#9333ea'; // purple (same as HR)
        case SECTOR_PRIVILEGES.MAINTENANCE: return '#f97316'; // orange
        case SECTOR_PRIVILEGES.WAREHOUSE: return '#16a34a'; // green
        case SECTOR_PRIVILEGES.PLOTTING: return '#14b8a6'; // teal
        default: return '#6b7280'; // gray
      }
    };

    const getPrivilegeLabel = () => {
      switch (privilege) {
        case SECTOR_PRIVILEGES.ADMIN: return 'ADM';
        case SECTOR_PRIVILEGES.HUMAN_RESOURCES: return 'RH';
        case SECTOR_PRIVILEGES.FINANCIAL: return 'FIN';
        case SECTOR_PRIVILEGES.PRODUCTION: return 'PRD';
        case SECTOR_PRIVILEGES.WAREHOUSE: return 'EST';
        case SECTOR_PRIVILEGES.MAINTENANCE: return 'MNT';
        case SECTOR_PRIVILEGES.DESIGNER: return 'DES';
        case SECTOR_PRIVILEGES.PLOTTING: return 'PLT';
        case SECTOR_PRIVILEGES.EXTERNAL: return 'EXT';
        default: return 'BSC';
      }
    };

    return (
      <View style={[styles.badge, { backgroundColor: getPrivilegeColor() }]}>
        <Text style={styles.badgeText}>{getPrivilegeLabel()}</Text>
      </View>
    );
  }
);

PrivilegeBadge.displayName = 'PrivilegeBadge';

// Quick access section for frequently used routes
const QuickAccessSection = memo<{
  routes: any[];
  onNavigate: (route: any) => void;
  isDark: boolean;
}>(({ routes, onNavigate, isDark }) => {
  if (routes.length === 0) return null;

  return (
    <View style={styles.quickAccessSection}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#a3a3a3' : '#737373' }]}>
        ACESSO RÁPIDO
      </Text>
      <View style={styles.quickAccessGrid}>
        {routes.slice(0, 6).map((route) => (
          <Pressable
            key={route.name}
            onPress={() => onNavigate(route)}
            style={({ pressed }) => [
              styles.quickAccessItem,
              pressed && styles.quickAccessItemPressed,
              { backgroundColor: isDark ? '#171717' : '#f5f5f5' }
            ]}
          >
            <Icon name="arrow-right" size="sm" variant="muted" />
            <Text
              style={[styles.quickAccessText, { color: isDark ? '#e5e5e5' : '#262626' }]}
              numberOfLines={1}
            >
              {route.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

QuickAccessSection.displayName = 'QuickAccessSection';

// Main drawer content
function PrivilegeDrawerContent({
  navigation,
  accessibleRoutes,
  userPrivileges,
  theme,
  isDark,
}: PrivilegeDrawerContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { favorites } = useFavorites();

  // Group routes by module for organized display
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, any[]> = {
      personal: [],
      admin: [],
      hr: [],
      production: [],
      inventory: [],
      financial: [],
      painting: [],
      other: [],
    };

    accessibleRoutes.forEach(route => {
      const module = route.module || 'other';
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(route);
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [accessibleRoutes]);

  // Get module display name
  const getModuleDisplayName = (module: string): string => {
    const names: Record<string, string> = {
      personal: 'Pessoal',
      admin: 'Administração',
      hr: 'Recursos Humanos',
      production: 'Produção',
      inventory: 'Estoque',
      financial: 'Financeiro',
      painting: 'Pintura',
      server: 'Servidor',
      statistics: 'Estatísticas',
      other: 'Outros',
    };
    return names[module] || module;
  };

  // Get module icon
  const getModuleIcon = (module: string): string => {
    const icons: Record<string, string> = {
      personal: 'user',
      admin: 'shield',
      hr: 'users',
      production: 'tool',
      inventory: 'box',
      financial: 'currency-dollar',
      painting: 'palette',
      server: 'server',
      statistics: 'chart-bar',
      other: 'folder',
    };
    return icons[module] || 'folder';
  };

  // Handle navigation
  const handleNavigate = useCallback((route: any) => {
    const startTime = Date.now();

    // Close drawer for better UX
    navigation.closeDrawer();

    // Navigate to route
    const routePath = route.name;
    router.push(`/(tabs)/${routePath}` as any);

    if (__DEV__) {
      console.log(`[NAV] ${route.title} (${Date.now() - startTime}ms)`);
    }
  }, [navigation, router]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPossibleRoutes = 380;
    const loadedRoutes = accessibleRoutes.length;
    const savedRoutes = totalPossibleRoutes - loadedRoutes;
    const percentageSaved = ((savedRoutes / totalPossibleRoutes) * 100).toFixed(0);

    return {
      loaded: loadedRoutes,
      saved: savedRoutes,
      percentage: percentageSaved,
    };
  }, [accessibleRoutes]);

  // Get highest privilege for display
  // Note: Team leadership is now determined by managedSector relationship, not privilege
  const highestPrivilege = useMemo(() => {
    if (userPrivileges.includes(SECTOR_PRIVILEGES.ADMIN)) return SECTOR_PRIVILEGES.ADMIN;
    if (userPrivileges.includes(SECTOR_PRIVILEGES.HUMAN_RESOURCES)) return SECTOR_PRIVILEGES.HUMAN_RESOURCES;
    return userPrivileges[0] || SECTOR_PRIVILEGES.BASIC;
  }, [userPrivileges]);

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
        {/* User info with privilege badges */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Icon name="user-circle" size="lg" variant="muted" />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: isDark ? '#f5f5f5' : '#171717' }]}>
                {user?.name || 'Usuário'}
              </Text>
              <View style={styles.privilegeContainer}>
                <Text style={[styles.userRole, { color: isDark ? '#a3a3a3' : '#737373' }]}>
                  {user?.sector?.name || 'Cargo'}
                </Text>
                <PrivilegeBadge privilege={highestPrivilege} isDark={isDark} />
              </View>
            </View>
          </View>

          {/* Performance stats in dev */}
          {__DEV__ && (
            <View style={[styles.statsContainer, { backgroundColor: isDark ? '#171717' : '#f3f4f6' }]}>
              <Text style={[styles.statsText, { color: isDark ? '#10b981' : '#059669' }]}>
                ⚡ {stats.percentage}% mais rápido
              </Text>
              <Text style={[styles.statsSubtext, { color: isDark ? '#a3a3a3' : '#6b7280' }]}>
                {stats.loaded} rotas carregadas • {stats.saved} economizadas
              </Text>
            </View>
          )}
        </View>

        {/* Quick access for most used routes */}
        <QuickAccessSection
          routes={accessibleRoutes.slice(0, 6)}
          onNavigate={handleNavigate}
          isDark={isDark}
        />

        {/* Grouped menu sections */}
        {Object.entries(groupedRoutes).map(([module, routes]) => (
          <View key={module} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name={getTablerIcon(getModuleIcon(module))}
                size="sm"
                variant="muted"
              />
              <Text style={[styles.sectionTitle, { color: isDark ? '#a3a3a3' : '#737373' }]}>
                {getModuleDisplayName(module).toUpperCase()}
              </Text>
              <Text style={[styles.sectionCount, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                ({routes.length})
              </Text>
            </View>

            {routes.map((route) => {
              const isActive = pathname.includes(route.name);

              return (
                <Pressable
                  key={route.name}
                  onPress={() => handleNavigate(route)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                      { color: isActive ? '#ffffff' : (isDark ? '#e5e5e5' : '#262626') }
                    ]}
                  >
                    {route.title}
                  </Text>
                  {isActive && (
                    <Icon name="check" size="sm" variant="onPrimary" />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            Navegação otimizada por privilégios
          </Text>
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
  privilegeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsContainer: {
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  quickAccessSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: '45%',
  },
  quickAccessItemPressed: {
    opacity: 0.7,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 11,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  menuItemActive: {
    backgroundColor: '#15803d',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(21, 128, 61, 0.1)',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default memo(PrivilegeDrawerContent);