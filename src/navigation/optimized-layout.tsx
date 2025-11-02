// Optimized navigation layout with lazy loading and performance improvements
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { Drawer } from "expo-router/drawer";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { useRouter, usePathname } from "expo-router";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { MENU_ITEMS, MenuItem } from '@/constants';
import { getFilteredMenuForUser, getTablerIcon } from '@/utils/navigation';
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

// Performance monitoring
const PERF_DEBUG = __DEV__;
const logPerformance = (action: string, startTime: number) => {
  if (PERF_DEBUG) {
    console.log(`[PERF] ${action}: ${Date.now() - startTime}ms`);
  }
};

// Lazy load heavy components
const DrawerContent = lazy(() => import('./DrawerContent'));

// Route configuration with lazy loading
interface RouteConfig {
  name: string;
  title: string;
  component?: React.ComponentType;
  loadComponent?: () => Promise<{ default: React.ComponentType }>;
  initialParams?: Record<string, any>;
}

// Core routes that are always loaded
const CORE_ROUTES: RouteConfig[] = [
  { name: "inicio", title: "Início" },
  { name: "configuracoes", title: "Configurações" },
  { name: "meu-perfil", title: "Perfil" },
];

// Module-based route groups for lazy loading
const ROUTE_MODULES = {
  production: () => [
    { name: "producao/index", title: "Produção" },
    { name: "producao/aerografia/index", title: "Aerografia" },
    { name: "producao/cronograma/index", title: "Cronograma" },
    { name: "producao/garagens/index", title: "Garagens" },
    { name: "producao/observacoes/index", title: "Observações" },
  ],

  inventory: () => [
    { name: "estoque/index", title: "Estoque" },
    { name: "estoque/produtos/index", title: "Produtos" },
    { name: "estoque/movimentacoes/index", title: "Movimentações" },
    { name: "estoque/fornecedores/index", title: "Fornecedores" },
  ],

  hr: () => [
    { name: "recursos-humanos/index", title: "Recursos Humanos" },
    { name: "recursos-humanos/avisos/index", title: "Advertências" },
    { name: "recursos-humanos/cargos/index", title: "Cargos" },
    { name: "recursos-humanos/feriados/index", title: "Feriados" },
    { name: "recursos-humanos/ferias/index", title: "Férias" },
  ],

  admin: () => [
    { name: "administracao/index", title: "Administração" },
    { name: "administracao/colaboradores/index", title: "Colaboradores" },
    { name: "administracao/clientes/index", title: "Clientes" },
    { name: "administracao/notificacoes/index", title: "Notificações" },
    { name: "administracao/setores/index", title: "Setores" },
  ],

  personal: () => [
    { name: "meu-pessoal/index", title: "Meu Pessoal" },
    { name: "meu-pessoal/advertencias", title: "Avisos" },
    { name: "meu-pessoal/emprestimos", title: "Empréstimos" },
    { name: "meu-pessoal/ferias", title: "Férias" },
  ],
};

// Route registry for dynamic loading
class RouteRegistry {
  private routes = new Map<string, RouteConfig>();
  private loadedModules = new Set<string>();

  registerCoreRoutes() {
    CORE_ROUTES.forEach(route => {
      this.routes.set(route.name, route);
    });
  }

  async loadModule(moduleName: keyof typeof ROUTE_MODULES) {
    if (this.loadedModules.has(moduleName)) {
      return;
    }

    const startTime = Date.now();
    const moduleRoutes = ROUTE_MODULES[moduleName]();

    moduleRoutes.forEach(route => {
      this.routes.set(route.name, route);
    });

    this.loadedModules.add(moduleName);
    logPerformance(`Load module ${moduleName}`, startTime);
  }

  getRoute(name: string): RouteConfig | undefined {
    return this.routes.get(name);
  }

  getAllRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  isModuleLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }
}

const routeRegistry = new RouteRegistry();

// Initialize core routes
routeRegistry.registerCoreRoutes();

// Custom hook for route management
function useOptimizedRoutes(userPrivileges?: string[]) {
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadModuleIfNeeded = useCallback(async (moduleName: keyof typeof ROUTE_MODULES) => {
    if (!routeRegistry.isModuleLoaded(moduleName)) {
      setIsLoading(true);
      await routeRegistry.loadModule(moduleName);
      setLoadedModules(prev => new Set([...prev, moduleName]));
      setIsLoading(false);
    }
  }, []);

  // Pre-load modules based on user privileges
  useEffect(() => {
    const preloadModules = async () => {
      if (userPrivileges?.includes('ADMIN')) {
        await loadModuleIfNeeded('admin');
      }
      if (userPrivileges?.includes('HUMAN_RESOURCES')) {
        await loadModuleIfNeeded('hr');
      }
      // Always load personal module
      await loadModuleIfNeeded('personal');
    };

    preloadModules();
  }, [userPrivileges, loadModuleIfNeeded]);

  return {
    routes: routeRegistry.getAllRoutes(),
    loadModule: loadModuleIfNeeded,
    isLoading,
    loadedModules,
  };
}

// Loading fallback component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#15803d" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

// Optimized Drawer Layout Component
export function OptimizedDrawerLayout() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const pathname = usePathname();
  const { canGoBack, goBack } = useNavigationHistory();
  const insets = useSafeAreaInsets();

  const userPrivileges = useMemo(() =>
    user?.sectors?.map(s => s.privilege) || [],
    [user]
  );

  const { routes, loadModule, isLoading } = useOptimizedRoutes(userPrivileges);

  // Memoized drawer colors
  const drawerColors = useMemo(() => ({
    background: isDark ? "#0a0a0a" : "#ffffff",
    text: isDark ? "#e5e5e5" : "#262626",
    activeText: "#ffffff",
    active: "#15803d",
  }), [isDark]);

  // Handle navigation to unloaded modules
  const handleNavigation = useCallback(async (path: string) => {
    const startTime = Date.now();

    // Determine which module to load based on path
    if (path.startsWith('/producao')) {
      await loadModule('production');
    } else if (path.startsWith('/estoque')) {
      await loadModule('inventory');
    } else if (path.startsWith('/recursos-humanos')) {
      await loadModule('hr');
    } else if (path.startsWith('/administracao')) {
      await loadModule('admin');
    }

    logPerformance(`Navigation to ${path}`, startTime);
  }, [loadModule]);

  // Pre-fetch modules on hover/focus (web) or on drawer open (mobile)
  const prefetchModule = useCallback((moduleName: keyof typeof ROUTE_MODULES) => {
    // Fire and forget - don't await
    loadModule(moduleName);
  }, [loadModule]);

  return (
    <Drawer
      drawerContent={(props) => (
        <Suspense fallback={<LoadingScreen />}>
          <DrawerContent
            {...props}
            onNavigate={handleNavigation}
            onPrefetch={prefetchModule}
            userPrivileges={userPrivileges}
            theme={theme}
            isDark={isDark}
          />
        </Suspense>
      )}
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          canGoBack ? (
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
            >
              <Icon name="arrow-left" size="md" variant="default" />
            </Pressable>
          ) : null
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            <ThemeToggle />
            <Pressable
              onPress={() => navigation.openDrawer()}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
            >
              <Icon name="menu" size="md" variant="default" />
            </Pressable>
          </View>
        ),
        drawerPosition: "right",
        drawerStyle: {
          backgroundColor: drawerColors.background,
          width: 280,
        },
        drawerActiveTintColor: drawerColors.activeText,
        drawerActiveBackgroundColor: drawerColors.active,
        drawerInactiveTintColor: drawerColors.text,
      })}
    >
      {/* Register only loaded routes */}
      {routes.map((route) => (
        <Drawer.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            lazy: true, // Enable lazy loading for screens
          }}
        />
      ))}

      {/* Show loading overlay when loading modules */}
      {isLoading && (
        <Drawer.Screen
          name="__loading__"
          options={{ title: "Loading..." }}
          component={LoadingScreen}
        />
      )}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#525252',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
});

export default OptimizedDrawerLayout;